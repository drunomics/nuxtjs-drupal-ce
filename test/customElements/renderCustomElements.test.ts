// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'

// useDrupalCe uses Nuxt's module system with '#app' and '#imports' virtual modules.
// For unit testing, we need to mock these, but we want to use real Vue features for what we're testing

// Mock #app which provides Nuxt's app utilities (not used by renderCustomElements)
vi.mock('#app', () => ({
  callWithNuxt: vi.fn(), // Used by other parts of useDrupalCe
}))

// Create a mock Vue app with component registry
const mockComponents = new Map()

// Define test components
const TestComponent = {
  props: {
    foo: String
  },
  template: '<div>Test</div>'
}

const AnotherComponent = {
  props: {
    baz: String
  },
  template: '<div>Another</div>'
}

// Register components in our mock registry
mockComponents.set('TestComponent', TestComponent)
mockComponents.set('AnotherComponent', AnotherComponent)

// Mock #imports which provides composables and Vue utilities
vi.mock('#imports', () => ({
  h: (name: string) => ({
    name,
    __isComponent: true // some marker to identify it's a component
  }),
  useNuxtApp: () => ({
    vueApp: {
      component: (name) => mockComponents.get(name)
    }
  }),
  // Mock the rest that's only used by other parts of useDrupalCe
  useRuntimeConfig: () => ({
    public: { drupalCe: {} },
    drupalCe: {}
  }),
  ref: vi.fn(),
  computed: vi.fn(),
}))

describe('renderCustomElements', () => {
  const { renderCustomElements } = useDrupalCe()

  it('handles null input', () => {
    const result = renderCustomElements(null)
    expect(result).toBe(null)
  })

  it('handles undefined input', () => {
    const result = renderCustomElements(undefined)
    expect(result).toBe(null)
  })

  it('handles empty object input', () => {
    const result = renderCustomElements({})
    expect(result).toBe(null)
  })

  it('handles plain string input', () => {
    const result = renderCustomElements('Hello World')
    expect(result).toMatchObject({
      template: '<div v-html="content"></div>',
      data: expect.any(Function)
    })
    expect(result.data().content).toBe('Hello World')
  })

  it('handles HTML string input', () => {
    const htmlString = '<p>Hello <strong>World</strong></p>'
    const result = renderCustomElements(htmlString)
    expect(result).toMatchObject({
      template: '<div v-html="content"></div>',
      data: expect.any(Function)
    })
    expect(result.data().content).toBe(htmlString)
  })

  it('handles single custom element object', () => {
    const customElement = {
      element: 'test-component',
      props: { foo: 'bar' }
    }
    const result = renderCustomElements(customElement)
    expect(result).toBeTruthy()
    expect(result.type).toBe(TestComponent)
  })

  it('handles array of custom elements', () => {
    const customElements = [
      {
        element: 'test-component',
        props: { foo: 'bar' }
      },
      'Plain text element',
      {
        element: 'another-component',
        props: { baz: 'qux' }
      }
    ]
    const result = renderCustomElements(customElements)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(3)

    // First component
    expect(result[0].type).toBe(TestComponent)
    expect(result[0].props).toMatchObject({
      foo: 'bar'
    })

    // Text element
    expect(result[1]).toMatchObject({
      template: '<div v-html="content"></div>',
      data: expect.any(Function)
    })
    expect(result[1].data().content).toBe('Plain text element')

    // Third component
    expect(result[2].type).toBe(AnotherComponent)
    expect(result[2].props).toMatchObject({
      baz: 'qux'
    })
  })

  it('handles array with only string elements', () => {
    const elements = ['Text 1', '<p>HTML text</p>']
    const result = renderCustomElements(elements)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)

    result.forEach((component, index) => {
      expect(component).toMatchObject({
        template: '<div v-html="content"></div>',
        data: expect.any(Function)
      })
      expect(component.data().content).toBe(elements[index])
    })
  })
})
