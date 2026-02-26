// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, Fragment } from 'vue'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'

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
})
