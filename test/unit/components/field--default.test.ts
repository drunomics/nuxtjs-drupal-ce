// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../../src/runtime/composables/useDrupalCe'
import FieldDefault from '../../../playground/components/global/field--default.vue'

describe('field--default custom element', () => {
  const createFieldComponent = content => defineComponent({
    components: { 'field-image': FieldDefault },
    setup() {
      const { renderCustomElements } = useDrupalCe()
      return { component: renderCustomElements({
        element: 'field-image',
        content,
      }) }
    },
    template: '<component :is="component" />',
  })

  it('renders field content via content attribute', async () => {
    const wrapper = await mountSuspended(createFieldComponent(
      '<img loading="lazy" src="https://placehold.co/600x400" width="600" height="400" alt="test image" />',
    ))
    expect(wrapper.html()).toContain('<img loading="lazy" src="https://placehold.co/600x400"')
    expect(wrapper.html()).toContain('width="600" height="400"')
    expect(wrapper.html()).toContain('alt="test image"')
  })
})
