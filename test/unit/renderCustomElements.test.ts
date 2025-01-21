// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import {useNuxtApp} from "#imports";

describe('renderCustomElements', () => {
  const { renderCustomElements } = useDrupalCe()

  // Define reusable test components
  const TestComponent = defineComponent({
    name: 'TestComponent',
    props: {
      foo: String
    },
    template: '<div>Test Component: {{ foo }}</div>'
  })

  const AnotherComponent = defineComponent({
    name: 'AnotherComponent',
    props: {
      bar: String
    },
    template: '<div>Another Component: {{ bar }}</div>'
  })
  const app = useNuxtApp()
  app.vueApp.component('TestComponent', TestComponent)
  app.vueApp.component('AnotherComponent', AnotherComponent)

  describe('basic input handling', () => {
    it('should return null for empty inputs', () => {
      expect(renderCustomElements(null)).toBe(null)
      expect(renderCustomElements(undefined)).toBe(null)
      expect(renderCustomElements({})).toBe(null)
    })

    it('should render nothing when component is null', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements(null) }
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.html()).toBe('')
    })
  })

  describe('string rendering', () => {
    it('should render plain text', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements('Hello World') }
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.text()).toBe('Hello World')
    })

    it('should render HTML string preserving markup', async () => {
      const htmlString = '<p>Hello <strong>World</strong></p>'
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements(htmlString) }
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.html()).toContain(htmlString)
      expect(wrapper.text()).toBe('Hello World')
    })
  })

  describe('custom element rendering', () => {
    it('should render a single custom element', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements({
              element: 'test-component',
              foo: 'bar'
            })}
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.text()).toBe('Test Component: bar')
    })
  })

  describe('array handling', () => {
    it('should render array of strings in a wrapper div', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements(['Text 1', '<p>Text 2</p>']) }
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.html()).toContain('<div>')
      expect(wrapper.text()).toContain('Text 1')
      expect(wrapper.text()).toContain('Text 2')
      expect(wrapper.html()).toContain('<p>Text 2</p>')
    })

    it('should render array of custom elements in a wrapper div', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements([
              { element: 'test-component', foo: 'one' },
              { element: 'another-component', bar: 'two' }
            ]) }
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.html()).toContain('<div>')
      expect(wrapper.text()).toContain('Test Component: one')
      expect(wrapper.text()).toContain('Another Component: two')
    })
  })

  describe('edge cases', () => {
    it('should handle malformed element objects', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements({ element: 'test-component' })}
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.text()).toBe('Test Component:')
    })

    it('should handle nonexistent components', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements({
              element: 'nonexistent-component',
              foo: 'bar'
            })}
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.html()).toBe('')
    })

    it('should handle empty arrays', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements([]) }
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.html()).toBe('')
    })
  })
})
