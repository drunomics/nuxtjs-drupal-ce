// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import DrupalLibraryDefault from '../../playground/components/global/drupal-library--default.vue'

// Stub the composable's loadLibrary so the test stays DOM-side-effect free and
// asserts only what the component forwards; the loader's own behaviour is
// covered by drupalLibraryLoader.test.ts.
const loadLibrary = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
mockNuxtImport('useDrupalCe', () => () => ({ loadLibrary }))

describe('drupal-library--default custom element', () => {
  beforeEach(() => loadLibrary.mockClear())

  const props = {
    library: 'core/drupal.states',
    js: [{ url: '/core/misc/states.js?v=1' }],
    drupalSettings: '{"my_module":{"some_key":"value"}}',
  }

  it('is renderless — emits no markup', async () => {
    const wrapper = await mountSuspended(DrupalLibraryDefault, { props })
    expect(wrapper.html().replace(/<!--.*?-->/gs, '').trim()).toBe('')
  })

  it('forwards its props (incl. the library name) to loadLibrary on mount', async () => {
    await mountSuspended(DrupalLibraryDefault, { props })
    await flushPromises()
    expect(loadLibrary).toHaveBeenCalledTimes(1)
    expect(loadLibrary).toHaveBeenCalledWith({
      name: props.library,
      js: props.js,
      drupalSettings: props.drupalSettings,
    })
  })
})
