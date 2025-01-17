// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, useNuxtApp } from '#imports'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'

describe('Custom Element Fallback Tests', () => {
  const NodeArticleDemo = defineComponent({
    name: 'NodeArticleDemo',
    props: { content: String },
    template: `<div class="node node-article-demo"><h2>Article Demo Component</h2>{{ content }}</div>`
  })

  const NodeArticleDefault = defineComponent({
    name: 'NodeArticleDefault',
    props: { content: String },
    template: `<div class="node node-article"><h2>Article Default Component</h2>{{ content }}</div>`
  })

  const NodeDefault = defineComponent({
    name: 'NodeDefault',
    props: { content: String },
    template: `<div class="node"><h2>Node Default Component</h2>{{ content }}</div>`
  })

  const app = useNuxtApp()
  app.vueApp.component('NodeArticleDemo', NodeArticleDemo)
  app.vueApp.component('NodeArticleDefault', NodeArticleDefault)
  app.vueApp.component('NodeDefault', NodeDefault)

  const createTestComponent = (elementData) => defineComponent({
    setup() {
      const { renderCustomElements } = useDrupalCe()
      return { component: renderCustomElements(elementData) }
    },
    template: '<component :is="component" />'
  })

  it('renders specific component when available', async () => {
    const elementData = {
      element: 'node-article-demo',
      content: 'Article demo'
    }
    const wrapper = await mountSuspended(createTestComponent(elementData))
    expect(wrapper.html()).toContain('Article demo')
    expect(wrapper.findComponent(NodeArticleDemo).exists()).toBe(true)
  })

  it('falls back to node-article--default when specific component not found', async () => {
    const elementData = {
      element: 'node-article-custom',
      content: 'Testing intermediate fallback'
    }
    const wrapper = await mountSuspended(createTestComponent(elementData))
    expect(wrapper.html()).toContain('Testing intermediate fallback')
    expect(wrapper.findComponent(NodeArticleDefault).exists()).toBe(true)
  })

  it('falls back to node--default when no intermediate default found', async () => {
    const elementData = {
      element: 'node-special-custom',
      content: 'Testing final fallback'
    }
    const wrapper = await mountSuspended(createTestComponent(elementData))
    expect(wrapper.html()).toContain('Testing final fallback')
    expect(wrapper.findComponent(NodeDefault).exists()).toBe(true)
  })
})
