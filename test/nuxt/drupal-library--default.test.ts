// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import DrupalLibraryDefault from '../../playground/components/global/drupal-library--default.vue'

// Mock the actual loader so the component test stays DOM-side-effect free; the
// loader's own behaviour is covered by drupalLibraryLoader.test.ts.
const { loadDrupalLibrary } = vi.hoisted(() => ({ loadDrupalLibrary: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../../src/runtime/composables/useDrupalCe/drupalLibraryLoader', () => ({ loadDrupalLibrary }))

describe('drupal-library--default custom element', () => {
  beforeEach(() => loadDrupalLibrary.mockClear())

  const data = {
    element: 'drupal-library-core-drupal-states',
    library: 'core/drupal.states',
    js: [{ url: '/core/misc/states.js?v=1' }],
    drupalSettings: '{"my_module":{"some_key":"value"}}',
  }

  const createComponent = (d: Record<string, unknown> = data) => defineComponent({
    components: { 'drupal-library-core-drupal-states': DrupalLibraryDefault },
    setup() {
      const { renderCustomElements } = useDrupalCe()
      return { component: renderCustomElements(d) }
    },
    template: '<component :is="component" />',
  })

  it('is renderless — emits no markup', async () => {
    const wrapper = await mountSuspended(createComponent())
    // Only a comment placeholder for the null render, no elements.
    expect(wrapper.html().replace(/<!--.*?-->/gs, '').trim()).toBe('')
  })

  it('loads the resolved library on mount', async () => {
    await mountSuspended(createComponent())
    await flushPromises()
    expect(loadDrupalLibrary).toHaveBeenCalledTimes(1)
    expect(loadDrupalLibrary.mock.calls[0]![0]).toEqual({
      js: data.js,
      drupalSettings: data.drupalSettings,
    })
  })
})
