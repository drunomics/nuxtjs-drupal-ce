// @vitest-environment nuxt
import { describe, it, expect, beforeAll } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useDrupalCe, isJsonRenderSpec } from '../../src/runtime/composables/useDrupalCe'
import DrupalCeJsonRender from '../../src/runtime/components/DrupalCeJsonRender'
import { useNuxtApp } from '#imports'

/**
 * The json-render spec shape custom_elements emits (issue #3580092): a flat
 * element map with children/slots referencing other elements by key, inline
 * HTML wrapped in drupal-markup elements carrying props.markup.
 */
const SPEC = {
  root: 'el-0',
  elements: {
    'el-0': {
      type: 'article-teaser',
      props: { title: 'Hello', href: '/article/1' },
      children: ['el-1'],
      slots: { media: ['el-2'] },
    },
    'el-1': {
      type: 'drupal-markup',
      props: { markup: '<p>Body text</p>' },
      children: [],
    },
    'el-2': {
      type: 'teaser-image',
      props: { src: '/img.jpg' },
      children: [],
    },
  },
}

describe('DrupalCeJsonRender', () => {
  beforeAll(() => {
    const vueApp = useNuxtApp().vueApp
    vueApp.component('ArticleTeaser', defineComponent({
      name: 'ArticleTeaser',
      props: { title: String, href: String },
      template: '<article :data-href="href"><h2>{{ title }}</h2><div class="media"><slot name="media" /></div><slot /></article>',
    }))
    vueApp.component('TeaserImage', defineComponent({
      name: 'TeaserImage',
      props: { src: String },
      template: '<img :src="src">',
    }))
    vueApp.component('DrupalMarkup', defineComponent({
      name: 'DrupalMarkup',
      props: { content: String },
      setup: props => () => h('div', { class: 'markup', innerHTML: props.content }),
    }))
  })

  it('detects a json-render spec', () => {
    expect(isJsonRenderSpec(SPEC)).toBe(true)
    expect(isJsonRenderSpec({ element: 'node-article', props: {} })).toBe(false)
    expect(isJsonRenderSpec('<p>markup</p>')).toBe(false)
    expect(isJsonRenderSpec(null)).toBe(false)
    expect(isJsonRenderSpec([SPEC])).toBe(false)
  })

  it('renders a spec: props, children, named slots and drupal-markup', async () => {
    const wrapper = await mountSuspended(defineComponent({
      components: { DrupalCeJsonRender },
      setup: () => ({ spec: SPEC }),
      template: '<DrupalCeJsonRender :spec="spec" />',
    }))

    const article = wrapper.find('article')
    expect(article.exists()).toBe(true)
    expect(article.attributes('data-href')).toBe('/article/1')
    expect(article.find('h2').text()).toBe('Hello')
    // drupal-markup child renders through the app's markup component.
    expect(article.find('.markup p').text()).toBe('Body text')
    // The named slot bridges to the slot element of the spec.
    expect(article.find('.media img').attributes('src')).toBe('/img.jpg')
  })

  it('routes a json-render page content through renderCustomElements when enabled', async () => {
    useNuxtApp().vueApp.component('DrupalCeJsonRender', DrupalCeJsonRender)
    const { renderCustomElements } = useDrupalCe()
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => renderCustomElements(SPEC),
    }))
    expect(wrapper.find('article h2').text()).toBe('Hello')
    expect(wrapper.find('.media img').attributes('src')).toBe('/img.jpg')
  })
})
