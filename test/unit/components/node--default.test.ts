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
})
