// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import App from '~/app.vue'

describe('Custom layouts work', () => {
  registerEndpoint('/api/drupal-ce/testing/node/3', () => ({
    content: {
      element: 'drupal-markup',
      body: '<p>Test content</p>'
    },
    local_tasks: {},
    messages: [],
    metatags: { meta: [], link: [], jsonld: [] },
    page_layout: 'clear'
  }))

  registerEndpoint('/api/menu/api/menu_items/main', () => ([]))

  it('renders a page with a custom layout', async () => {
    const component = await mountSuspended(App, {
      route: '/testing/node/3'
    })
    expect(component.html()).toContain('id="main-clear"')
  })
})
