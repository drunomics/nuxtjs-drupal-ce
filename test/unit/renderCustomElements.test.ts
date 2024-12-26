// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'

describe('renderCustomElements', () => {
  const { renderCustomElements } = useDrupalCe()

  // Define reusable test components
  const TestComponent = defineComponent({
    props: {
      foo: String
    },
    template: '<div>Test Component: {{ foo || "" }}</div>'
  })

  const AnotherComponent = defineComponent({
    props: {
      bar: String
    },
    template: '<div>Another Component: {{ bar }}</div>'
  })

  describe('basic input handling', () => {
    const NullRenderer = defineComponent({
      setup() {
        return { component: renderCustomElements(null) }
      },
      template: '<component :is="component" />'
    })

    it('should return null for empty inputs', () => {
      expect(renderCustomElements(null)).toBe(null)
      expect(renderCustomElements(undefined)).toBe(null)
      expect(renderCustomElements({})).toBe(null)
    })

    it('should render nothing when component is null', async () => {
      const wrapper = await mountSuspended(NullRenderer)
      expect(wrapper.html()).toBe('')
    })
  })

  describe('string rendering', () => {
    it('should render plain text', async () => {
      const TextRenderer = defineComponent({
        setup() {
          return { component: renderCustomElements('Hello World') }
        },
        template: '<component :is="component" />'
      })
      const wrapper = await mountSuspended(TextRenderer)
      expect(wrapper.text()).toBe('Hello World')
    })

    it('should render HTML string preserving markup', async () => {
      const htmlString = '<p>Hello <strong>World</strong></p>'
      const HtmlRenderer = defineComponent({
        setup() {
          return { component: renderCustomElements(htmlString) }
        },
        template: '<component :is="component" />'
      })
      const wrapper = await mountSuspended(HtmlRenderer)
      expect(wrapper.html()).toContain(htmlString)
      expect(wrapper.text()).toBe('Hello World')
    })
  })

  describe('custom element rendering', () => {
    it('should render a single custom element', async () => {
      const ComponentRenderer = defineComponent({
        components: { TestComponent },
        setup() {
          return { component: renderCustomElements({
              element: 'test-component',
              foo: 'bar'
            })}
        },
        template: '<component :is="component" />'
      })
      const wrapper = await mountSuspended(ComponentRenderer)
      expect(wrapper.text()).toBe('Test Component: bar')
    })
  })

  describe('array handling', () => {
    it('should render array of strings', async () => {
      const StringArrayRenderer = defineComponent({
        setup() {
          const content = ['Text 1', '<p>Text 2</p>']
          return {
            components: content.map(item => renderCustomElements(item))
          }
        },
        template: '<div><component v-for="comp in components" :is="comp" /></div>'
      })
      const wrapper = await mountSuspended(StringArrayRenderer)
      expect(wrapper.text()).toContain('Text 1')
      expect(wrapper.text()).toContain('Text 2')
      expect(wrapper.html()).toContain('<p>Text 2</p>')
    })

    it('should render array of custom elements', async () => {
      const ElementArrayRenderer = defineComponent({
        components: { TestComponent, AnotherComponent },
        setup() {
          const content = [
            { element: 'test-component', foo: 'one' },
            { element: 'another-component', bar: 'two' }
          ]
          return {
            components: content.map(item => renderCustomElements(item))
          }
        },
        template: '<div><component v-for="comp in components" :is="comp" /></div>'
      })
      const wrapper = await mountSuspended(ElementArrayRenderer)
      expect(wrapper.text()).toContain('Test Component: one')
      expect(wrapper.text()).toContain('Another Component: two')
    })
  })

  describe('edge cases', () => {
    it('should handle malformed element objects', async () => {
      const MalformedRenderer = defineComponent({
        components: { TestComponent },
        setup() {
          return { component: renderCustomElements({ element: 'test-component' })}
        },
        template: '<component :is="component" />'
      })
      const wrapper = await mountSuspended(MalformedRenderer)
      expect(wrapper.text()).toBe('Test Component:')
    })

    it('should handle nonexistent components', async () => {
      const NonexistentRenderer = defineComponent({
        setup() {
          return { component: renderCustomElements({
              element: 'nonexistent-component',
              foo: 'bar'
            })}
        },
        template: '<component :is="component" />'
      })
      const wrapper = await mountSuspended(NonexistentRenderer)
      expect(wrapper.html()).toBe('')
    })

    it('should handle empty arrays', async () => {
      const EmptyArrayRenderer = defineComponent({
        setup() {
          return { component: renderCustomElements([]) }
        },
        template: '<component :is="component" />'
      })
      const wrapper = await mountSuspended(EmptyArrayRenderer)
      expect(wrapper.html()).toBe('')
    })
  })
})
