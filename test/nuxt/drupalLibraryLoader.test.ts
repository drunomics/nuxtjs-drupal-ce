// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'

type LoaderModule = typeof import('../../src/runtime/composables/useDrupalCe/drupalLibraryLoader')

/**
 * Tests the standalone Drupal library loader. Script `<script>` tags are mocked
 * to "load" immediately (there is no real network), so the assertions cover the
 * loader's own behaviour: URL resolution, insertion order, dedup, drupalSettings
 * seeding and the run-once attachBehaviors barrier.
 */
describe('drupalLibraryLoader', () => {
  let loadDrupalLibrary: LoaderModule['loadDrupalLibrary']
  let injected: HTMLScriptElement[]
  let attachBehaviors: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Fresh module per test so the module-level queue/loaded-set reset.
    vi.resetModules()
    ;({ loadDrupalLibrary } = await import('../../src/runtime/composables/useDrupalCe/drupalLibraryLoader'))

    injected = []
    attachBehaviors = vi.fn()
    ;(window as unknown as { Drupal?: unknown }).Drupal = { attachBehaviors }
    ;(window as unknown as { drupalSettings?: unknown }).drupalSettings = undefined
    if (!globalThis.CSS) {
      globalThis.CSS = { escape: (s: string) => s } as unknown as typeof CSS
    }

    // Mock script insertion: record scripts and fire onload on the next
    // microtask.
    vi.spyOn(document.head, 'appendChild').mockImplementation(((el: HTMLElement) => {
      if (el.tagName === 'SCRIPT') {
        injected.push(el as HTMLScriptElement)
        queueMicrotask(() => (el as HTMLScriptElement).onload?.(new Event('load')))
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

  it('seeds window.drupalSettings from the JSON string before loading', async () => {
    await loadDrupalLibrary(
      { js: [{ url: '/a.js' }], drupalSettings: '{"my_module":{"some_key":"value"}}' },
      'http://backend',
    )
    expect((window as unknown as { drupalSettings: Record<string, unknown> }).drupalSettings)
      .toEqual({ my_module: { some_key: 'value' }, ajaxPageState: { theme: '', theme_token: null, libraries: '' } })
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
        ajaxPageState: { theme: '', theme_token: null, libraries: '' },
      })
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
})
