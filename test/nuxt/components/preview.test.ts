// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import App from '~/app.vue'

describe('Preview routes', () => {
  registerEndpoint('http://127.0.0.1:3021/ce-api/node/preview/node', () => ({
    content: {
      element: 'node-article',
      body: '<p>Some <b>example</b> body.</p>'
    },
    local_tasks: {},
    messages: [],
    metatags: { meta: [], link: [], jsonld: [] }
  }))

  registerEndpoint('http://127.0.0.1:3021/ce-api/node/5/layout-preview', () => ({
    content: {
      element: 'node-article',
      body: '<p>Some <b>example</b> body.</p>'
    },
    local_tasks: {},
    messages: [],
    metatags: { meta: [], link: [], jsonld: [] }
  }))

  registerEndpoint('/api/menu/api/menu_items/main', () => ([
    { title: 'Test page', relative: '/node/1' }
  ]))

  it('renders preview/node with direct backend request, skipping drupal-ce-proxy', async () => {
    const component = await mountSuspended(App, {
      route: '/node/preview/node'
    })
    expect(component.html()).toContain('<p>Some <b>example</b> body.</p>')
  })

  it('renders node/5/layout-preview with direct backend request, skipping drupal-ce-proxy', async () => {
    const component = await mountSuspended(App, {
      route: '/node/5/layout-preview'
    })
    expect(component.html()).toContain('<p>Some <b>example</b> body.</p>')
  })
})
