// @vitest-environment nuxt
import { describe, it, expect, beforeAll } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineAsyncComponent, defineComponent, h, ref, nextTick } from 'vue'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import { useNuxtApp } from '#imports'

// A custom element is a data payload. Every key the rendering component does
// not declare as a prop would otherwise fall through onto its root element as
// a non-standard HTML attribute.
describe('custom element props', () => {
  let renderCustomElements: ReturnType<typeof useDrupalCe>['renderCustomElements']

  const Teaser = defineComponent({
    name: 'Teaser',
    props: { title: String },
    template: '<article>{{ title }}<slot /></article>',
  })

  // Nuxt registers global components asynchronously, so their declared props
  // are unknown until the component has loaded.
  const AsyncTeaser = defineAsyncComponent(() => Promise.resolve(Teaser))

  // Counts mounts, so a test can tell an in-place patch from a remount.
  let mountCount = 0
  const MountCounter = defineComponent({
    name: 'MountCounter',
    props: { title: String },
    setup(props) {
      mountCount++
      return () => h('span', props.title)
    },
  })

  beforeAll(() => {
    ({ renderCustomElements } = useDrupalCe())
    const app = useNuxtApp()
    app.vueApp.component('Teaser', Teaser)
    app.vueApp.component('AsyncTeaser', AsyncTeaser)
    app.vueApp.component('MountCounter', MountCounter)
  })

  const render = (data: Record<string, unknown>) => mountSuspended(defineComponent({
    setup() {
      return { component: renderCustomElements(data) }
    },
    template: '<component :is="component" />',
  }))

  it('drops keys the component does not declare', async () => {
    const wrapper = await render({
      element: 'teaser',
      title: 'A title',
      heroType: 'wide',
      authorHref: '/author/1',
    })
    expect(wrapper.html()).toBe('<article>A title</article>')
  })

  it('drops keys an asynchronously registered component does not declare', async () => {
    const wrapper = await render({
      element: 'async-teaser',
      title: 'A title',
      heroType: 'wide',
    })
    expect(wrapper.html()).toBe('<article>A title</article>')
  })

  it('keeps attributes that are valid on any element', async () => {
    const wrapper = await render({
      'element': 'teaser',
      'title': 'A title',
      'class': 'is-featured',
      'id': 'teaser-1',
      'data-id': 'teaser',
      'aria-hidden': 'true',
      'heroType': 'wide',
    })
    const article = wrapper.find('article').element
    expect(Array.from(article.attributes).map(attribute => attribute.name).sort())
      .toEqual(['aria-hidden', 'class', 'data-id', 'id'])
  })

  it('renders slots of the explicit format', async () => {
    const wrapper = await render({
      element: 'teaser',
      props: { title: 'A title', heroType: 'wide' },
      slots: { default: '<p>Slotted</p>' },
    })
    expect(wrapper.html()).toContain('<p>Slotted</p>')
    expect(wrapper.html()).not.toContain('herotype')
  })

  it('patches in place instead of remounting on re-render', async () => {
    const title = ref('First')
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return () => h('div', [renderCustomElements({ element: 'mount-counter', title: title.value, heroType: 'wide' })])
      },
    }))
    expect(mountCount).toBe(1)
    expect(wrapper.html()).toContain('First')

    title.value = 'Second'
    await nextTick()
    expect(wrapper.html()).toContain('Second')
    expect(mountCount).toBe(1)
  })
})
