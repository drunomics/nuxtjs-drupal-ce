// test/unit/components/drupal-ce-markup.test.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../../src/runtime/composables/useDrupalCe'

describe('drupal-ce-markup custom element', () => {
  const markupData = {
    element: 'drupal-ce-markup',
    prefix: '<div class="drupal-ce-markup-test"><div><h2>Test header</h2></div>',
    suffix: '</div>',
    content: [
      {
        element: 'drupal-markup',
        content: '<p>Some <b>formatted</b> content.</p>',
      },
    ],
  }

  const createMarkupComponent = (data = markupData) => defineComponent({
    setup() {
      const { renderCustomElements } = useDrupalCe()
      return { component: renderCustomElements(data) }
    },
    template: '<component :is="component" />',
  })

  it('renders prefix/suffix markup and content via custom element json', async () => {
    const wrapper = await mountSuspended(createMarkupComponent())
    expect(wrapper.findAll('.drupal-ce-markup-test')).toHaveLength(1)
    expect(wrapper.get('h2').text()).toBe('Test header')
    expect(wrapper.html()).toContain('<p>Some <b>formatted</b> content.</p>')
  })
})
