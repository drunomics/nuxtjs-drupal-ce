// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useNuxtApp, useRouter } from '#imports'

type LoaderModule = typeof import('../../src/runtime/composables/useDrupalCe/drupalLibraryLoader')

/**
 * Tests the Drupal library loader. Script `<script>` tags are mocked
 * to "load" immediately (there is no real network), so the assertions cover the
 * loader's own behaviour: URL resolution, insertion order, dedup, drupalSettings
 * seeding and the run-once attachBehaviors barrier.
 */
describe('drupalLibraryLoader', () => {
  let loadDrupalLibrary: LoaderModule['loadDrupalLibrary']
  let injected: HTMLScriptElement[]
  let attachBehaviors: ReturnType<typeof vi.fn>
  /** When false, scripts stay pending until a test fires onload/onerror. */
  let autoLoad: boolean

  beforeEach(async () => {
    // Fresh module per test so the module-level queue/loaded-set reset.
    vi.resetModules()
    ;({ loadDrupalLibrary } = await import('../../src/runtime/composables/useDrupalCe/drupalLibraryLoader'))

    const nuxtApp = useNuxtApp()
    nuxtApp.$i18n = undefined
    nuxtApp.$localePath = undefined
    await useRouter().push('/')

    injected = []
    autoLoad = true
    attachBehaviors = vi.fn()
    ;(window as unknown as { Drupal?: unknown }).Drupal = { attachBehaviors }
    ;(window as unknown as { drupalSettings?: unknown }).drupalSettings = undefined
    if (!globalThis.CSS) {
      globalThis.CSS = { escape: (s: string) => s } as unknown as typeof CSS
    }

    // Mock script insertion: record scripts and, unless a test drives loading
    // itself, fire onload on the next microtask.
    vi.spyOn(document.head, 'appendChild').mockImplementation(((el: HTMLElement) => {
      if (el.tagName === 'SCRIPT') {
        injected.push(el as HTMLScriptElement)
        if (autoLoad) queueMicrotask(() => (el as HTMLScriptElement).onload?.(new Event('load')))
        return el
      }
      return Node.prototype.appendChild.call(document.head, el)
    }) as typeof document.head.appendChild)
  })

  it('injects a library JS in order, absolute, async=false, tagged', async () => {
    await loadDrupalLibrary(
      { js: [{ url: '/core/misc/jquery.js?v=1' }, { url: '/core/misc/drupal.js?v=1' }] },
      'http://backend',
    )
    expect(injected.map(s => s.src)).toEqual([
      'http://backend/core/misc/jquery.js?v=1',
      'http://backend/core/misc/drupal.js?v=1',
    ])
    expect(injected.every(s => s.async === false)).toBe(true)
    expect(injected[0]!.dataset.drupalLibrary).toBe('http://backend/core/misc/jquery.js?v=1')
    expect(attachBehaviors).toHaveBeenCalledTimes(1)
  })

  it('passes absolute and protocol-relative URLs through untouched', async () => {
    await loadDrupalLibrary({ js: [{ url: 'https://cdn.example/x.js' }] }, 'http://backend')
    expect(injected.map(s => s.src)).toEqual(['https://cdn.example/x.js'])
  })

  it('loads each URL only once across calls (dedup)', async () => {
    await loadDrupalLibrary({ js: [{ url: '/a.js' }] }, 'http://backend')
    await loadDrupalLibrary({ js: [{ url: '/a.js' }, { url: '/b.js' }] }, 'http://backend')
    expect(injected.map(s => s.src)).toEqual(['http://backend/a.js', 'http://backend/b.js'])
  })

  it('keeps dependency order across separate calls', async () => {
    // Two libraries queued in the same tick — jQuery before the dependent one.
    const first = loadDrupalLibrary({ js: [{ url: '/jquery.js' }] }, 'http://backend')
    const second = loadDrupalLibrary({ js: [{ url: '/states.js' }] }, 'http://backend')
    await Promise.all([first, second])
    expect(injected.map(s => s.src)).toEqual(['http://backend/jquery.js', 'http://backend/states.js'])
  })

  it('inserts all script tags up front so downloads run in parallel', async () => {
    autoLoad = false
    const first = loadDrupalLibrary({ js: [{ url: '/jquery.js' }, { url: '/once.js' }, { url: '/drupal.js' }] }, 'http://backend')
    const second = loadDrupalLibrary({ js: [{ url: '/states.js' }] }, 'http://backend')

    // Nothing has loaded yet, still every tag is in place, in request order.
    expect(injected.map(s => s.src)).toEqual([
      'http://backend/jquery.js',
      'http://backend/once.js',
      'http://backend/drupal.js',
      'http://backend/states.js',
    ])
    expect(injected.every(s => s.async === false)).toBe(true)

    injected.forEach(s => s.onload?.(new Event('load')))
    await Promise.all([first, second])
    expect(attachBehaviors).toHaveBeenCalledTimes(1)
  })

  it('attaches behaviors once, only after every script of the batch has loaded', async () => {
    autoLoad = false
    const settled: string[] = []
    const first = loadDrupalLibrary({ js: [{ url: '/jquery.js' }, { url: '/drupal.js' }] }, 'http://backend')
      .then(() => settled.push('first'))
    const second = loadDrupalLibrary({ js: [{ url: '/states.js' }] }, 'http://backend')
      .then(() => settled.push('second'))
    const flush = () => new Promise(resolve => setTimeout(resolve))

    // A later library does not settle before an earlier one.
    injected[2]!.onload?.(new Event('load'))
    injected[0]!.onload?.(new Event('load'))
    await flush()
    expect(settled).toEqual([])
    expect(attachBehaviors).not.toHaveBeenCalled()

    injected[1]!.onload?.(new Event('load'))
    await Promise.all([first, second])
    expect(settled).toEqual(['first', 'second'])
    expect(attachBehaviors).toHaveBeenCalledTimes(1)
  })

  it('does not let a failing script block the rest or the behaviors', async () => {
    autoLoad = false
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const done = loadDrupalLibrary({ js: [{ url: '/a.js' }, { url: '/missing.js' }, { url: '/c.js' }] }, 'http://backend')
    expect(injected).toHaveLength(3)

    injected[0]!.onload?.(new Event('load'))
    injected[1]!.onerror?.(new Event('error'))
    injected[2]!.onload?.(new Event('load'))
    await done
    expect(warn).toHaveBeenCalledWith('[drupal-library] skipped, failed to load http://backend/missing.js')
    expect(attachBehaviors).toHaveBeenCalledTimes(1)
  })

  it('shares a still-loading script between libraries instead of injecting it twice', async () => {
    autoLoad = false
    let secondSettled = false
    const first = loadDrupalLibrary({ js: [{ url: '/jquery.js' }] }, 'http://backend')
    const second = loadDrupalLibrary({ js: [{ url: '/jquery.js' }] }, 'http://backend')
      .then(() => (secondSettled = true))
    expect(injected.map(s => s.src)).toEqual(['http://backend/jquery.js'])

    await new Promise(resolve => setTimeout(resolve))
    expect(secondSettled).toBe(false)

    injected[0]!.onload?.(new Event('load'))
    await Promise.all([first, second])
    expect(attachBehaviors).toHaveBeenCalledTimes(1)
  })

  it('seeds window.drupalSettings from the JSON string before loading', async () => {
    await loadDrupalLibrary(
      { js: [{ url: '/a.js' }], drupalSettings: '{"my_module":{"some_key":"value"}}' },
      'http://backend',
    )
    expect((window as unknown as { drupalSettings: Record<string, unknown> }).drupalSettings)
      .toEqual({
        my_module: { some_key: 'value' },
        path: { baseUrl: '/', pathPrefix: '' },
        ajaxPageState: { theme: '', theme_token: null, libraries: '' },
      })
  })

  it('skips core drupalSettingsLoader.js so it cannot wipe the in-memory settings', async () => {
    // core/misc/drupalSettingsLoader.js resets window.drupalSettings to {} and
    // only repopulates it from a drupal-settings-json element that a CE page
    // never emits. Loading it would drop the AJAX settings (and thus the
    // managed_file upload's Drupal.ajax instance), so it must not be injected.
    await loadDrupalLibrary(
      {
        js: [
          { url: '/core/misc/drupalSettingsLoader.js?v=11.4.5' },
          { url: '/core/misc/drupal.js?v=1' },
        ],
        drupalSettings: '{"ajax":{"edit-x":{"url":"/form/x?ajax_form=1"}}}',
      },
      'http://backend',
    )
    expect(injected.map(s => s.src)).toEqual(['http://backend/core/misc/drupal.js?v=1'])
    expect((window as unknown as { drupalSettings: Record<string, unknown> }).drupalSettings)
      .toEqual({
        ajax: { 'edit-x': { url: '/form/x?ajax_form=1' } },
        path: { baseUrl: '/', pathPrefix: '' },
        ajaxPageState: { theme: '', theme_token: null, libraries: '' },
      })
  })

  it('skips site-configured scripts (skipLibraryScripts substring match)', async () => {
    await loadDrupalLibrary(
      { js: [{ url: '/core/misc/tabledrag.js?v=1' }, { url: '/core/misc/drupal.js?v=1' }] },
      'http://backend',
      ['tabledrag.js'],
    )
    expect(injected.map(s => s.src)).toEqual(['http://backend/core/misc/drupal.js?v=1'])
  })

  it('defaults drupalSettings.ajaxPageState so Ajax.beforeSerialize does not throw', async () => {
    // core/misc/ajax.js Drupal.Ajax.beforeSerialize reads ajaxPageState.theme /
    // .theme_token / .libraries; a CE-rendered form omits ajaxPageState, so
    // without a default beforeSerialize throws and no request is ever sent.
    await loadDrupalLibrary(
      { js: [{ url: '/a.js' }], drupalSettings: '{"ajax":{"edit-x":{"url":"/form/x?ajax_form=1"}}}' },
      'http://backend',
    )
    const seeded = (window as unknown as { drupalSettings: { ajaxPageState?: Record<string, unknown> } }).drupalSettings
    expect(seeded.ajaxPageState).toEqual({ theme: '', theme_token: null, libraries: '' })
  })

  it('keeps a backend-provided ajaxPageState instead of overwriting it', async () => {
    await loadDrupalLibrary(
      { js: [{ url: '/a.js' }], drupalSettings: '{"ajaxPageState":{"theme":"olivero","theme_token":"tok","libraries":"abc"}}' },
      'http://backend',
    )
    const seeded = (window as unknown as { drupalSettings: { ajaxPageState?: Record<string, unknown> } }).drupalSettings
    expect(seeded.ajaxPageState).toEqual({ theme: 'olivero', theme_token: 'tok', libraries: 'abc' })
  })

  it('reports loaded library names as ajaxPageState.libraries so the backend skips their assets', async () => {
    // The backend diffs its AJAX-response assets against ajaxPageState.libraries.
    // Reporting what the drupal-library components loaded (a plain comma list)
    // stops it re-sending add_css/add_js for libraries already on the page, and a
    // non-empty list avoids the empty-'' entry that trips core's asset resolver.
    await loadDrupalLibrary(
      { name: 'core/drupal.ajax', js: [{ url: '/ajax.js' }], drupalSettings: '{"ajax":{"edit-x":{"url":"/form/x?ajax_form=1"}}}' },
      'http://backend',
    )
    // A later element carries only its name (drupalSettings is on the first only).
    await loadDrupalLibrary(
      { name: 'webform/webform.element.managed_file', js: [{ url: '/managed-file.js' }] },
      'http://backend',
    )
    const seeded = (window as unknown as { drupalSettings: { ajaxPageState: { libraries: string } } }).drupalSettings
    expect(seeded.ajaxPageState.libraries).toBe('core/drupal.ajax,webform/webform.element.managed_file')
  })

  it('keeps AJAX urls root-relative so they route through the same-origin form proxy', async () => {
    // The AJAX callback url must stay root-relative: it then resolves against the
    // frontend origin, where the drupalFormHandler middleware proxies the request
    // (and its ?ajax_form=1 response) to the backend. Absolutizing it here would
    // instead send Drupal.ajax cross-origin and bypass the proxy.
    const settings = {
      ajax: {
        'edit-upload-button': {
          url: '/form/x?ajax_form=1',
          callback: 'foo',
          progress: { type: 'bar', url: '/file/progress/123' },
        },
      },
      ajaxTrustedUrl: { '/form/x?ajax_form=1': true },
    }
    await loadDrupalLibrary(
      { js: [{ url: '/a.js' }], drupalSettings: JSON.stringify(settings) },
      'http://backend',
    )
    const seeded = (window as unknown as { drupalSettings: typeof settings }).drupalSettings
    expect(seeded.ajax['edit-upload-button'].url).toBe('/form/x?ajax_form=1')
    expect(seeded.ajax['edit-upload-button'].progress.url).toBe('/file/progress/123')
    expect(seeded.ajaxTrustedUrl).toEqual({ '/form/x?ajax_form=1': true })
  })

  describe('drupalSettings.path', () => {
    const seededPath = () => (window as unknown as { drupalSettings: { path: Record<string, unknown> } }).drupalSettings.path
    // Same as core's Drupal.url().
    const drupalUrl = (path: string) => `${seededPath().baseUrl}${seededPath().pathPrefix}${path}`
    const load = (drupalSettings?: string) => loadDrupalLibrary({ js: [], drupalSettings }, 'http://backend')

    /** Navigates to a route of the given locale, as @nuxtjs/i18n prefixes it. */
    const visit = async (path: string, locale: string = 'en') => {
      const nuxtApp = useNuxtApp()
      nuxtApp.$i18n = { locale: ref(locale), defaultLocale: 'en' }
      nuxtApp.$localePath = (path: string) => locale === 'en' ? path : `/${locale}${path === '/' ? '' : path}`
      await useRouter().push(nuxtApp.$localePath(path))
    }

    it('seeds baseUrl and pathPrefix on the first load on a route when the backend sends no path', async () => {
      await load('{"my_module":{}}')
      expect(seededPath()).toEqual({ baseUrl: '/', pathPrefix: '' })
      expect(drupalUrl('form/x')).toBe('/form/x')
    })

    it('seeds them for a library without drupalSettings', async () => {
      await load()
      expect(seededPath()).toEqual({ baseUrl: '/', pathPrefix: '' })
    })

    it('seeds the language prefix of the current locale', async () => {
      await visit('/form/a', 'de')
      await load('{"my_module":{}}')
      expect(seededPath()).toEqual({ baseUrl: '/', pathPrefix: 'de/' })
      expect(drupalUrl('form/x')).toBe('/de/form/x')
    })

    it('seeds baseUrl and pathPrefix when the backend sends them as null, keeping other keys', async () => {
      await visit('/form/b', 'de')
      await load('{"path":{"baseUrl":null,"pathPrefix":null,"currentPath":"form/x","isFront":false}}')
      expect(seededPath()).toEqual({ baseUrl: '/', pathPrefix: 'de/', currentPath: 'form/x', isFront: false })
    })

    it('keeps non-null backend values, including an empty pathPrefix', async () => {
      await visit('/form/c', 'de')
      await load('{"path":{"baseUrl":"/sub/","pathPrefix":""}}')
      expect(seededPath()).toEqual({ baseUrl: '/sub/', pathPrefix: '' })
    })

    it('keeps the seeded values on later loads on the same route', async () => {
      await visit('/form/d', 'de')
      await load('{"path":{"baseUrl":"/sub/"}}')
      // Neither missing nor null values of a later library reset them.
      await load('{"my_module":{}}')
      await load('{"path":{"baseUrl":null,"pathPrefix":null,"currentPath":"form/x"}}')
      await load()
      expect(seededPath()).toEqual({ baseUrl: '/sub/', pathPrefix: 'de/', currentPath: 'form/x' })
    })

    it('updates the prefix on the first load after a route change, e.g. a locale switch', async () => {
      await visit('/form/e', 'de')
      await load('{"my_module":{}}')
      expect(seededPath()).toEqual({ baseUrl: '/', pathPrefix: 'de/' })

      await visit('/form/e', 'en')
      await load('{"path":{"baseUrl":null,"pathPrefix":null}}')
      expect(seededPath()).toEqual({ baseUrl: '/', pathPrefix: '' })

      await visit('/form/e', 'de')
      await load()
      expect(seededPath()).toEqual({ baseUrl: '/', pathPrefix: 'de/' })
    })

    it('leaves invalid drupalSettings to the seeding, which reports them', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      await load('{invalid')
      expect(error).toHaveBeenCalledWith('[drupal-library] invalid drupalSettings', expect.anything())
      await load('{"my_module":{}}')
      expect(seededPath()).toEqual({ baseUrl: '/', pathPrefix: '' })
    })
  })
})
