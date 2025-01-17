// test/unit/components/drupal-markup.test.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../../src/runtime/composables/useDrupalCe'
import DrupalMarkup from '../../../playground/components/global/drupal-markup.vue'

describe('drupal-markup custom element', () => {
  const markupData = {
    element: 'drupal-markup',
    content: '<p>Some <b>formatted</b> content.</p>'
  }

  const createMarkupComponent = (data = markupData) => defineComponent({
    components: { 'drupal-markup': DrupalMarkup },
    setup() {
      const { renderCustomElements } = useDrupalCe()
      return { component: renderCustomElements(data) }
    },
    template: '<component :is="component" />'
  })

  it('renders markup content via custom element json', async () => {
    const wrapper = await mountSuspended(createMarkupComponent())
    expect(wrapper.html()).toContain('<p>Some <b>formatted</b> content.</p>')
  })

  it('renders markup content via custom element markup ', async () => {
    const TestComponent = defineComponent({
      components: { 'drupal-markup': DrupalMarkup },
      template: '<drupal-markup><p>Slotted <b>content</b></p></drupal-markup>'
    })
    const wrapper = await mountSuspended(TestComponent)
    expect(wrapper.html()).toContain('<p>Slotted <b>content</b></p>')
  })
})
