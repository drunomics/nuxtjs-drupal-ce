// test/unit/components/drupal-markup.test.ts
// @vitest-environment nuxt
import { describe, it, expect, beforeAll } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../../src/runtime/composables/useDrupalCe'

describe('drupal-markup custom element', () => {
  // Resolved in beforeAll: the nuxt app instance only exists once the
  // environment has initialized, after test collection.
  let renderCustomElements: ReturnType<typeof useDrupalCe>['renderCustomElements']

  beforeAll(() => {
    ({ renderCustomElements } = useDrupalCe())
  })
  const addWrappingDiv = (children: string): string => '<div style="display: contents;">\n  ' + children + '\n</div>'

  describe('content prop', () => {
    it('renders markup content via content prop', async () => {
      const component = defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'drupal-markup',
              content: '<p>Some <b>formatted</b> content.</p>',
            }),
          }
        },
        template: '<component :is="component" />',
      })
      const wrapper = await mountSuspended(component)
      expect(wrapper.html()).toContain('<p>Some <b>formatted</b> content.</p>')
      expect(wrapper.html()).toEqual(addWrappingDiv('<p>Some <b>formatted</b> content.</p>'))
    })

    it('renders markup content via content prop attribute', async () => {
      const TestComponent = defineComponent({
        template: '<drupal-markup content="<p>Prop <b>content</b></p>"></drupal-markup>',
      })
      const wrapper = await mountSuspended(TestComponent)
      expect(wrapper.html()).toEqual(addWrappingDiv('<p>Prop <b>content</b></p>'))
    })
  })

  describe('default slot', () => {
    it('renders markup content via default slot', async () => {
      const component = defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'drupal-markup',
              slots: {
                default: '<p>Slot <b>content</b></p>',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      })
      const wrapper = await mountSuspended(component)
      expect(wrapper.html()).toContain('<p>Slot <b>content</b></p>')
    })

    it('renders markup content via Vue template slot', async () => {
      const TestComponent = defineComponent({
        template: '<drupal-markup><p>Slotted <b>content</b></p></drupal-markup>',
      })
      const wrapper = await mountSuspended(TestComponent)
      expect(wrapper.html()).toContain('<p>Slotted <b>content</b></p>')
      // drupal-markup should not add a wrapping element when only slot is used.
      // (Vue emits a <!--v-if--> placeholder for the unused content div.)
      expect(wrapper.html()).not.toContain('<div')
    })

    it('renders nested elements via slot', async () => {
      const component = defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'drupal-markup',
              slots: {
                default: {
                  element: 'drupal-markup',
                  slots: {
                    default: '<em>Nested</em>',
                  },
                },
              },
            }),
          }
        },
        template: '<component :is="component" />',
      })
      const wrapper = await mountSuspended(component)
      expect(wrapper.html()).toContain('<em>Nested</em>')
    })
  })

  describe('both slot and content prop', () => {
    it('renders both slot and content prop (slot first, then prop)', async () => {
      const TestComponent = defineComponent({
        template: '<drupal-markup content="<p>Prop content</p>"><span>Slot content</span></drupal-markup>',
      })
      const wrapper = await mountSuspended(TestComponent)
      const html = wrapper.html()
      // Both should be present
      expect(html).toContain('<span>Slot content</span>')
      expect(html).toContain('<p>Prop content</p>')
      // Slot should come before prop content
      const slotIndex = html.indexOf('<span>Slot content</span>')
      const propIndex = html.indexOf('<p>Prop content</p>')
      expect(slotIndex).toBeLessThan(propIndex)
    })

    it('renders both with slot and content prop', async () => {
      const component = defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'drupal-markup',
              props: {
                content: '<p>Prop</p>',
              },
              slots: {
                default: '<span>Slot</span>',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      })
      const wrapper = await mountSuspended(component)
      const html = wrapper.html()
      expect(html).toContain('<span>Slot</span>')
      expect(html).toContain('<p>Prop</p>')
      // Slot should come before prop
      expect(html.indexOf('<span>Slot</span>')).toBeLessThan(html.indexOf('<p>Prop</p>'))
    })
  })

  describe('empty/null content', () => {
    it('renders nothing when no content or slot provided', async () => {
      const TestComponent = defineComponent({
        template: '<drupal-markup></drupal-markup>',
      })
      const wrapper = await mountSuspended(TestComponent)
      // Should render empty or minimal HTML
      expect(wrapper.html()).toBeTruthy()
    })

    it('renders only slot when content prop is undefined', async () => {
      const component = defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'drupal-markup',
              slots: {
                default: '<p>Only slot</p>',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      })
      const wrapper = await mountSuspended(component)
      expect(wrapper.html()).toContain('<p>Only slot</p>')
      // The component's own content div is skipped when the content prop is undefined;
      // Vue emits a <!--v-if--> placeholder in its place.
      expect(wrapper.html()).toContain('<!--v-if-->')
    })

    it('renders only content prop when slot is empty', async () => {
      const TestComponent = defineComponent({
        template: '<drupal-markup content="<p>Only prop</p>"></drupal-markup>',
      })
      const wrapper = await mountSuspended(TestComponent)
      expect(wrapper.html()).toContain('<p>Only prop</p>')
    })
  })
})
