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

    // Mock script insertion: record it and fire onload on the next microtask.
    vi.spyOn(document.head, 'appendChild').mockImplementation(((el: HTMLScriptElement) => {
      injected.push(el)
      queueMicrotask(() => el.onload?.(new Event('load')))
      return el
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
      .toEqual({ my_module: { some_key: 'value' } })
  })
})
