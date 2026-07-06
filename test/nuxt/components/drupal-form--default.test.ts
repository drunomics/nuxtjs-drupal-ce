// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../../src/runtime/composables/useDrupalCe'
import DrupalFormDefault from '../../../playground/components/global/drupal-form--default.vue'

describe('drupal-form--default custom element', () => {
  const formData = {
    element: 'drupal-form',
    props: {
      formId: 'user_login_form',
      attributes: {
        class: ['user-login-form'],
        dataDrupalSelector: 'user-login-form'
      },
      method: 'post',
    },
    slots: {
      default: '<div>Some form content html.</div>'
    }
  }

  const createFormComponent = (data = formData) => defineComponent({
    components: { 'drupal-form': DrupalFormDefault },
    setup() {
      const { renderCustomElements } = useDrupalCe()
      return { component: renderCustomElements(data) }
    },
    template: '<component :is="component" />'
  })

  it('renders form correctly', async () => {
    const wrapper = await mountSuspended(createFormComponent())
    expect(wrapper.find('form').attributes('formid')).toBe('user_login_form')
    expect(wrapper.find('form').attributes('method')).toBe('post')
    expect(wrapper.find('form').classes()).toContain('user-login-form')
    expect(wrapper.find('form').attributes('datadrupalselector')).toBe('user-login-form')
    expect(wrapper.html()).toContain('<div>Some form content html.</div>')
  })
})
