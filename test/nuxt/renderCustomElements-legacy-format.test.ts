// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import { useNuxtApp } from '#imports'

describe('renderCustomElements - Legacy Format', () => {
  const { renderCustomElements } = useDrupalCe()

  // Define reusable test components
  const TestComponent = defineComponent({
    name: 'TestComponent',
    props: {
      foo: String,
      bar: String,
    },
    template: '<section>Test: {{ foo }} {{ bar }}</section>',
  })

  const LayoutComponent = defineComponent({
    name: 'LayoutComponent',
    props: {
      layout: String,
      first: Object,
      second: Object,
    },
    template: '<div>Layout: {{ layout }}</div>',
  })

  const app = useNuxtApp()
  app.vueApp.component('TestComponent', TestComponent)
  app.vueApp.component('LayoutComponent', LayoutComponent)

  let consoleWarnSpy: any

  beforeEach(() => {
    // Mock console.warn to capture warnings
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  describe('legacy format detection', () => {
    it('should detect legacy format (no props/slots keys)', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'test-component',
              foo: 'bar',
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toBe('Test: bar')
    })

    it('should spread all properties as props in legacy format', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'test-component',
              foo: 'value1',
              bar: 'value2',
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toBe('Test: value1 value2')
    })

    it('should handle complex props in legacy format', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'layout-component',
              layout: 'twocol',
              first: { data: 'first region' },
              second: { data: 'second region' },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toContain('Layout: twocol')
    })
  })

  describe('dev mode warnings', () => {
    it('should log warning in dev mode when legacy format detected with explicit config', async () => {
      // This test assumes customElementJsonFormat is set to 'explicit' (the default)
      await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'test-component',
              foo: 'bar',
            }),
          }
        },
        template: '<component :is="component" />',
      }))

      // In dev mode, should warn about legacy format
      if (import.meta.dev) {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[nuxtjs-drupal-ce] Legacy format detected'),
        )
      }
    })

    it('should include migration hint in warning', async () => {
      await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'test-component',
              foo: 'bar',
            }),
          }
        },
        template: '<component :is="component" />',
      }))

      if (import.meta.dev) {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('explicit format: {element, props: {}, slots: {}}'),
        )
      }
    })
  })

  describe('backward compatibility', () => {
    it('should still render correctly despite being legacy format', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'test-component',
              foo: 'legacy',
              bar: 'format',
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toBe('Test: legacy format')
      expect(wrapper.html()).toContain('<section>')
    })

    it('should handle nested legacy format elements', async () => {
      const NestedComponent = defineComponent({
        name: 'NestedComponent',
        props: {
          content: Object,
        },
        template: '<div><slot /></div>',
      })
      app.vueApp.component('NestedComponent', NestedComponent)

      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'test-component',
              foo: 'parent',
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toContain('Test: parent')
    })

    it('should handle arrays in legacy format', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements([
              {
                element: 'test-component',
                foo: 'first',
              },
              {
                element: 'test-component',
                foo: 'second',
              },
            ]),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toContain('Test: first')
      expect(wrapper.text()).toContain('Test: second')
    })
  })

  describe('mixed format scenarios', () => {
    it('should handle explicit parent with legacy child', async () => {
      const ParentComponent = defineComponent({
        name: 'ParentComponent',
        props: {
          title: String,
        },
        slots: {
          default: () => any,
        },
        template: '<div><h1>{{ title }}</h1><slot /></div>',
      })
      app.vueApp.component('ParentComponent', ParentComponent)

      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'parent-component',
              props: {
                title: 'Explicit Parent',
              },
              slots: {
                default: {
                  element: 'test-component',
                  foo: 'legacy child',
                },
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toContain('Explicit Parent')
      expect(wrapper.text()).toContain('Test: legacy child')
    })
  })
})
