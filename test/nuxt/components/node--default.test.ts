// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../../src/runtime/composables/useDrupalCe'
import NodeDefault from '../../../playground/components/global/node--default.vue'

describe('node--default custom element', () => {
  const nodeData = {
    element: 'node',
    title: 'Test article',
    body: '<p>Some <b>example</b> body.</p>',
    image: '<img loading="lazy" src="https://placehold.co/600x400" width="600" height="400" alt="test" />'
  }

  const createNodeComponent = (data = nodeData) => defineComponent({
    components: { 'node': NodeDefault },
    setup() {
      const { renderCustomElements } = useDrupalCe()
      return { component: renderCustomElements(data) }
    },
    template: '<component :is="component" />'
  })

  it('renders node with all attributes', async () => {
    const wrapper = await mountSuspended(createNodeComponent())
    expect(wrapper.find('h2').text()).toBe('Node: Test article')
    expect(wrapper.html()).toContain('Some <b>example</b> body')
    expect(wrapper.html()).toContain('<img loading="lazy" src="https://placehold.co/600x400"')
  })

  it('renders node without title', async () => {
    const wrapper = await mountSuspended(createNodeComponent({
      ...nodeData,
      title: undefined
    }))
    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.html()).toContain('Some <b>example</b> body')
    expect(wrapper.html()).toContain('<img loading="lazy" src="https://placehold.co/600x400"')
  })

  it('renders node with only title while body and image are undefined', async () => {
    const wrapper = await mountSuspended(createNodeComponent({
      element: 'node',
      title: 'Just a title',
    }))
    expect(wrapper.find('h2').text()).toBe('Node: Just a title')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('renders node with layout builder sections', async () => {
    const wrapper = await mountSuspended(createNodeComponent({
      element: 'node',
      sections: {
        element: 'drupal-layout',
        layout: 'twocol',
        settings: {
          label: 'Two column layout',
          column_widths: '50-50'
        },
        first: {
          element: 'drupal-markup',
          content: '<h2>First Column</h2><p>First column content</p>'
        },
        second: {
          element: 'drupal-markup',
          content: '<h2>Second Column</h2><p>Second column content</p>'
        }
      }
    }))
    expect(wrapper.html()).toContain('<h2>First Column</h2>')
    expect(wrapper.html()).toContain('<p>First column content</p>')
    expect(wrapper.html()).toContain('<h2>Second Column</h2>')
    expect(wrapper.html()).toContain('<p>Second column content</p>')
  })
})