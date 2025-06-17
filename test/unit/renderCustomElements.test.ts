// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import { useNuxtApp } from "#imports";

describe('renderCustomElements', () => {
  const { renderCustomElements } = useDrupalCe()

  // Define reusable test components
  const TestComponent = defineComponent({
    name: 'TestComponent',
    props: {
      foo: String
    },
    template: '<section>Test Component: {{ foo }}</section>'
  })

  const AnotherComponent = defineComponent({
    name: 'AnotherComponent',
    props: {
      bar: String
    },
    template: '<section>Another Component: {{ bar }}</section>'
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
      expect(wrapper.html()).toEqual('<div style="display: contents;">\n  ' + htmlString + '\n</div>')
      expect(wrapper.text()).toBe('Hello World')

      // Ensure bogus html and html with multiple root nodes works.
      const bogusHtmlString = '<div><input type="text" /><a></div><p>second element</p>';
      const component = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements(bogusHtmlString) }
        },
        template: '<component :is="component" />'
      }))
      // The bogus html string has to be cleaned and the 2nd element kept.
      expect(component.html()).toEqual('<div style="display: contents;">\n' +
        '  <div><input type="text"><a></a></div>\n' +
        '  <p>second element</p>\n' +
        '</div>')
    })
  })

  describe('custom element rendering', () => {
    it('should render a single custom element', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'test-component',
              foo: 'bar'
            })
          }
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.text()).toBe('Test Component: bar')
      expect(wrapper.html()).toEqual('<section>Test Component: bar</section>')
    })

    it('rendering known html tags is not supported', async () => {
      // Note: This produces a [Vue warn] also.
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'span',
              title: 'test',
              content: 'Text content'
            })
          }
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.html()).toEqual('')
    })
  })

  describe('array handling', () => {
    it('should render array of markup strings', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements(['Content 1', '<p>Text 2</p>']) }
        },
        template: '<component :is="component" />'
      }))
      // Content will be wrapped in divs but should be there.
      expect(wrapper.text()).toContain('Content 1')
      expect(wrapper.html()).toContain('<p>Text 2</p>')
    })

    it('should render array of custom elements without a wrapper div', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements([
              { element: 'test-component', foo: 'one' },
              { element: 'another-component', bar: 'two' }
            ])
          }
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.html()).not.toContain('<div>')
      expect(wrapper.text()).toContain('Test Component: one')
      expect(wrapper.text()).toContain('Another Component: two')
      expect(wrapper.html()).toEqual("<section>Test Component: one</section>\n" +
        "<section>Another Component: two</section>")
    })
  })

  describe('edge cases', () => {
    it('should handle malformed element objects', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return { component: renderCustomElements({ element: 'test-component' }) }
        },
        template: '<component :is="component" />'
      }))
      expect(wrapper.text()).toBe('Test Component:')
    })

    it('should handle nonexistent components', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'nonexistent-component',
              foo: 'bar'
            })
          }
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
