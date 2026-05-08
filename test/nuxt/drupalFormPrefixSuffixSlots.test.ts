// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DrupalFormDefault from '../../playground/components/global/drupal-form--default.vue'

describe('drupal-form--default #prefix / #suffix slots', () => {
  it('renders #prefix and #suffix outside the wrapper form', async () => {
    const wrapper = await mountSuspended(DrupalFormDefault, {
      props: {
        formId: 'user_login_form',
        attributes: {},
        method: 'post',
      },
      slots: {
        default: '<div class="default-content">default</div>',
        prefix: '<div class="prefix-content">prefix</div>',
        suffix: '<div class="suffix-content">suffix</div>',
      },
    })

    const html = wrapper.html()
    const formHtml = wrapper.find('form').html()

    // Default slot lands inside the form.
    expect(formHtml).toContain('default-content')

    // Prefix and suffix render in the wrapper output but NOT inside the form
    // (sibling forms in #prefix / #suffix would otherwise be nested).
    expect(html).toContain('prefix-content')
    expect(html).toContain('suffix-content')
    expect(formHtml).not.toContain('prefix-content')
    expect(formHtml).not.toContain('suffix-content')
  })
})
