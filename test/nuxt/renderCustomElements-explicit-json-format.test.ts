// @vitest-environment nuxt
import { describe, it, expect, beforeAll } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import { useNuxtApp } from '#imports'

describe('renderCustomElements - Explicit Format', () => {
  // Resolved in beforeAll: the nuxt app instance only exists once the
  // environment has initialized, after test collection.
  let renderCustomElements: ReturnType<typeof useDrupalCe>['renderCustomElements']

  // Define reusable test components
  const TestComponent = defineComponent({
    name: 'TestComponent',
    props: {
      foo: String,
    },
    slots: {
      default: () => any,
    },
    template: '<section>Test Component: {{ foo }}<slot /></section>',
  })

  const SlotComponent = defineComponent({
    name: 'SlotComponent',
    props: {
      title: String,
    },
    slots: {
      default: () => any,
      header: () => any,
      footer: () => any,
    },
    template: `
      <div class="slot-component">
        <header v-if="$slots.header"><slot name="header" /></header>
        <h2 v-if="title">{{ title }}</h2>
        <slot />
        <footer v-if="$slots.footer"><slot name="footer" /></footer>
      </div>
    `,
  })

  beforeAll(() => {
    ({ renderCustomElements } = useDrupalCe())
    const app = useNuxtApp()
    app.vueApp.component('TestComponent', TestComponent)
    app.vueApp.component('SlotComponent', SlotComponent)
  })

  describe('props only', () => {
    it('should render element with props only', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'test-component',
              props: {
                foo: 'bar',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toBe('Test Component: bar')
      expect(wrapper.html()).toContain('<section>Test Component: bar</section>')
    })

    it('should render element with empty props object', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'test-component',
              props: {},
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toBe('Test Component:')
    })

    it('should render element without props key', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'test-component',
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toBe('Test Component:')
    })
  })

  describe('slots only', () => {
    it('should render element with default slot (string)', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                default: 'Slot content',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toContain('Slot content')
    })

    it('should render element with default slot (HTML string)', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                default: '<p>HTML <strong>content</strong></p>',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.html()).toContain('<p>HTML <strong>content</strong></p>')
    })

    it('should render element with default slot (nested element)', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                default: {
                  element: 'test-component',
                  props: {
                    foo: 'nested',
                  },
                },
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toContain('Test Component: nested')
    })

    it('should render element with named slot', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                header: '<h1>Header Content</h1>',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.html()).toContain('<h1>Header Content</h1>')
      expect(wrapper.html()).toContain('<header>')
    })

    it('should render element with multiple named slots', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                header: '<h1>Header</h1>',
                default: '<p>Body</p>',
                footer: '<p>Footer</p>',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.html()).toContain('<h1>Header</h1>')
      expect(wrapper.html()).toContain('<p>Body</p>')
      expect(wrapper.html()).toContain('<p>Footer</p>')
    })
  })

  describe('props and slots combined', () => {
    it('should render element with both props and slots', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              props: {
                title: 'My Title',
              },
              slots: {
                default: '<p>Slot content</p>',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.html()).toContain('<h2>My Title</h2>')
      expect(wrapper.html()).toContain('<p>Slot content</p>')
    })

    it('should render with props and multiple named slots', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              props: {
                title: 'Title',
              },
              slots: {
                header: 'Header',
                default: 'Body',
                footer: 'Footer',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toContain('Header')
      expect(wrapper.text()).toContain('Title')
      expect(wrapper.text()).toContain('Body')
      expect(wrapper.text()).toContain('Footer')
    })
  })

  describe('nested slots', () => {
    it('should render 2-level nested slots', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              props: { title: 'Level 1' },
              slots: {
                default: {
                  element: 'slot-component',
                  props: { title: 'Level 2' },
                  slots: {
                    default: 'Nested content',
                  },
                },
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toContain('Level 1')
      expect(wrapper.text()).toContain('Level 2')
      expect(wrapper.text()).toContain('Nested content')
    })

    it('should render 3+ level deeply nested slots', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              props: { title: 'L1' },
              slots: {
                default: {
                  element: 'slot-component',
                  props: { title: 'L2' },
                  slots: {
                    default: {
                      element: 'slot-component',
                      props: { title: 'L3' },
                      slots: {
                        default: 'Deep content',
                      },
                    },
                  },
                },
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      const html = wrapper.html()
      // Validate all levels are present
      expect(html).toContain('<h2>L1</h2>')
      expect(html).toContain('<h2>L2</h2>')
      expect(html).toContain('<h2>L3</h2>')
      expect(html).toContain('Deep content')

      // Validate nesting structure: L1 contains L2, L2 contains L3
      const l1Match = html.match(/<div class="slot-component"[^>]*>[\s\S]*?<h2>L1<\/h2>[\s\S]*?<\/div>/)
      expect(l1Match).not.toBeNull()
      expect(l1Match).toHaveLength(1)
      const l1Content = l1Match![0]
      expect(l1Content).toContain('<h2>L2</h2>')
      expect(l1Content).toContain('<h2>L3</h2>')
      expect(l1Content).toContain('Deep content')
    })

    it('should render nested slots with mixed content types', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                header: '<h1>Header</h1>',
                default: {
                  element: 'test-component',
                  props: { foo: 'bar' },
                  slots: {
                    default: '<em>nested slot</em>',
                  },
                },
                footer: 'Plain text footer',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.html()).toContain('<h1>Header</h1>')
      expect(wrapper.html()).toContain('Test Component: bar')
      expect(wrapper.html()).toContain('<em>nested slot</em>')
      expect(wrapper.text()).toContain('Plain text footer')
    })
  })

  describe('slot content as array', () => {
    it('should render slot with array of strings', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                default: ['<p>First</p>', '<p>Second</p>'],
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.html()).toContain('<p>First</p>')
      expect(wrapper.html()).toContain('<p>Second</p>')
    })

    it('should render slot with array of elements', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                default: [
                  {
                    element: 'test-component',
                    props: { foo: 'one' },
                  },
                  {
                    element: 'test-component',
                    props: { foo: 'two' },
                  },
                ],
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.text()).toContain('Test Component: one')
      expect(wrapper.text()).toContain('Test Component: two')
    })

    it('should render slot with mixed array content', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                default: [
                  '<p>String</p>',
                  {
                    element: 'test-component',
                    props: { foo: 'element' },
                  },
                ],
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.html()).toContain('<p>String</p>')
      expect(wrapper.text()).toContain('Test Component: element')
    })
  })

  describe('empty slots handling', () => {
    it('should handle empty slots object', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              props: { title: 'Title' },
              slots: {},
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.html()).toContain('<h2>Title</h2>')
    })

    it('should handle null slot content', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              props: { title: 'Title' },
              slots: {
                default: null,
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      expect(wrapper.html()).toContain('<h2>Title</h2>')
      // Slot should exist but be empty
    })

    it('should handle undefined slot content', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                default: undefined,
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      // Should render the component wrapper even with undefined slot
      expect(wrapper.html()).toContain('<div class="slot-component">')
      expect(wrapper.html()).toContain('</div>')
    })

    it('should handle empty string slot content', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          return {
            component: renderCustomElements({
              element: 'slot-component',
              slots: {
                default: '',
              },
            }),
          }
        },
        template: '<component :is="component" />',
      }))
      // Should render the component wrapper even with empty string slot
      expect(wrapper.html()).toContain('<div class="slot-component">')
      expect(wrapper.html()).toContain('</div>')
    })
  })
})
