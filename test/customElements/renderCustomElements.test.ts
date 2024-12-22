// test/customElements/renderCustomElements.test.ts
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils'
import { renderCustomElements } from '../../src/runtime/composables/useDrupalCe'
import { defineComponent, h } from 'vue'

// Create real Vue components for testing
const TestComponent = defineComponent({
  name: 'TestComponent',
  props: {
    foo: String
  },
  render() {
    return h('div', this.foo)
  }
})

const AnotherComponent = defineComponent({
  name: 'AnotherComponent',
  props: {
    baz: String
  },
  render() {
    return h('div', this.baz)
  }
})

describe('renderCustomElements', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../../playground', import.meta.url)),
    configFile: 'nuxt.config4test',
    port: 3001,
  })

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
    const data = result.data()
    expect(data.content).toBe('Hello World')
  })

  it('handles HTML string input', () => {
    const htmlString = '<p>Hello <strong>World</strong></p>'
    const result = renderCustomElements(htmlString)
    expect(result).toMatchObject({
      template: '<div v-html="content"></div>',
      data: expect.any(Function)
    })
    const data = result.data()
    expect(data.content).toBe(htmlString)
  })

  it('handles single custom element object', () => {
    const customElement = {
      element: TestComponent,
      props: { foo: 'bar' }
    }
    const result = renderCustomElements(customElement)
    expect(result.type).toBe(TestComponent)
    expect(result.props).toMatchObject({
      foo: 'bar'
    })
  })

  it('handles array of custom elements', () => {
    const customElements = [
      {
        element: TestComponent,
        props: { foo: 'bar' }
      },
      'Plain text element',
      {
        element: AnotherComponent,
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
    const textData = result[1].data()
    expect(textData.content).toBe('Plain text element')

    // Third component
    expect(result[2].type).toBe(AnotherComponent)
    expect(result[2].props).toMatchObject({
      baz: 'qux'
    })
  })
})
