// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, Fragment } from 'vue'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import { useNuxtApp } from '#imports'

// A wrapper component that uses useSlotItems and renders each item in a .item div
const SlotConsumer = defineComponent({
  name: 'SlotConsumer',
  props: {
    slotName: {
      type: String,
      default: 'default',
    },
  },
  setup(props) {
    const { useSlotItems } = useDrupalCe()
    const items = useSlotItems(props.slotName)
    return { items }
  },
  render() {
    return h(
      'div',
      { class: 'items' },
      this.items.map((vnode, i) => h('div', { class: 'item', key: i }, [vnode])),
    )
  },
})

describe('useSlotItems', () => {
  it('returns empty array when slot is not provided', async () => {
    const wrapper = await mountSuspended(
      defineComponent({
        setup() {
          return () => h(SlotConsumer)
        },
      }),
    )
    expect(wrapper.findAll('.item')).toHaveLength(0)
  })

  it('returns slot items as a flat array', async () => {
    const wrapper = await mountSuspended(
      defineComponent({
        setup() {
          return () =>
            h(SlotConsumer, null, {
              default: () => [
                h('span', 'Item 1'),
                h('span', 'Item 2'),
                h('span', 'Item 3'),
              ],
            })
        },
      }),
    )
    expect(wrapper.findAll('.item')).toHaveLength(3)
    expect(wrapper.text()).toContain('Item 1')
    expect(wrapper.text()).toContain('Item 2')
    expect(wrapper.text()).toContain('Item 3')
  })

  it('unwraps Fragment wrappers into individual items', async () => {
    const wrapper = await mountSuspended(
      defineComponent({
        setup() {
          return () =>
            h(SlotConsumer, null, {
              default: () => [
                h(Fragment, [h('span', 'Frag 1'), h('span', 'Frag 2')]),
                h('span', 'Direct'),
              ],
            })
        },
      }),
    )
    expect(wrapper.findAll('.item')).toHaveLength(3)
    expect(wrapper.text()).toContain('Frag 1')
    expect(wrapper.text()).toContain('Frag 2')
    expect(wrapper.text()).toContain('Direct')
  })

  it('returns empty array for non-existent slot name', async () => {
    const wrapper = await mountSuspended(
      defineComponent({
        setup() {
          return () =>
            h(SlotConsumer, { slotName: 'nonexistent' }, {
              default: () => [h('span', 'Item')],
            })
        },
      }),
    )
    expect(wrapper.findAll('.item')).toHaveLength(0)
  })

  it('works with named slots', async () => {
    const wrapper = await mountSuspended(
      defineComponent({
        setup() {
          return () =>
            h(SlotConsumer, { slotName: 'items' }, {
              items: () => [h('span', 'Named 1'), h('span', 'Named 2')],
            })
        },
      }),
    )
    expect(wrapper.findAll('.item')).toHaveLength(2)
    expect(wrapper.text()).toContain('Named 1')
    expect(wrapper.text()).toContain('Named 2')
  })

  it('works with renderCustomElements teaser-list slot data', async () => {
    const { renderCustomElements } = useDrupalCe()

    // Stub components for teaser-list and teaser-square
    const TeaserList = defineComponent({
      name: 'TeaserList',
      setup() {
        const { useSlotItems } = useDrupalCe()
        const teasers = useSlotItems('teasers')
        return { teasers }
      },
      render() {
        return h('div', { class: 'teaser-list' },
          this.teasers.map((vnode, i) => h('div', { class: 'teaser-item', key: i }, [vnode])),
        )
      },
    })

    const TeaserSquare = defineComponent({
      name: 'TeaserSquare',
      props: {
        href: String,
        title: String,
      },
      template: '<a class="teaser-square" :href="href">{{ title }}</a>',
    })

    const app = useNuxtApp()
    app.vueApp.component('TeaserList', TeaserList)
    app.vueApp.component('TeaserSquare', TeaserSquare)

    const teaserListData = {
      element: 'teaser-list',
      props: {
        contains: 'teaser-square',
      },
      slots: {
        teasers: [
          { element: 'teaser-square', props: { href: '/node/1', title: 'Node 1' } },
          { element: 'teaser-square', props: { href: '/node/2', title: 'Node 2' } },
          { element: 'teaser-square', props: { href: '/node/3', title: 'Node 3' } },
        ],
      },
    }

    const wrapper = await mountSuspended(
      defineComponent({
        setup() {
          return { component: renderCustomElements(teaserListData) }
        },
        template: '<component :is="component" />',
      }),
    )

    // Verify teaser-list renders
    expect(wrapper.find('.teaser-list').exists()).toBe(true)

    // Verify useSlotItems extracts all 3 teasers from the slot
    const items = wrapper.findAll('.teaser-item')
    expect(items).toHaveLength(3)

    // Verify each teaser-square renders with correct props
    const teasers = wrapper.findAll('.teaser-square')
    expect(teasers).toHaveLength(3)
    expect(teasers[0].text()).toBe('Node 1')
    expect(teasers[0].attributes('href')).toBe('/node/1')
    expect(teasers[1].text()).toBe('Node 2')
    expect(teasers[1].attributes('href')).toBe('/node/2')
    expect(teasers[2].text()).toBe('Node 3')
    expect(teasers[2].attributes('href')).toBe('/node/3')
  })
})
