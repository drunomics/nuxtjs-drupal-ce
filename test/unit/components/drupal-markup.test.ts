// test/unit/components/drupal-markup.test.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../../src/runtime/composables/useDrupalCe'

describe('drupal-markup custom element', () => {
  const { renderCustomElements } = useDrupalCe()

  it('renders markup content via custom element json', async () => {
    const component = defineComponent({
      setup() {
        return { component: renderCustomElements({
            element: 'drupal-markup',
            content: '<p>Some <b>formatted</b> content.</p>'
          }) }
      },
      template: '<component :is="component" />'
    })
    const wrapper = await mountSuspended(component)
    expect(wrapper.html()).toContain('<p>Some <b>formatted</b> content.</p>')
    // drupal-markup should not add a wrapping element
    expect(wrapper.html()).toEqual('<p>Some <b>formatted</b> content.</p>')
  })

  it('renders markup content given via attribute ', async () => {
    const TestComponent = defineComponent({
      template: '<drupal-markup content="<p>Slotted <b>content</b></p>"></drupal-markup>'
    })
    const wrapper = await mountSuspended(TestComponent)
    expect(wrapper.html()).toEqual('<p>Slotted <b>content</b></p>')
  })

  it('renders markup content via custom element markup ', async () => {
    const TestComponent = defineComponent({
      template: '<drupal-markup><p>Slotted <b>content</b></p></drupal-markup>'
    })
    const wrapper = await mountSuspended(TestComponent)
    expect(wrapper.html()).toContain('<p>Slotted <b>content</b></p>')
    // drupal-markup should not add a wrapping element
    expect(wrapper.html()).toEqual('<p>Slotted <b>content</b></p>')
  })
})
