import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, fetch, $fetch } from '@nuxt/test-utils/e2e'
import { join } from 'node:path'

describe('Component Preview Production CORS', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    nuxtConfig: {
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3015',
        ceApiEndpoint: '/ce-api',
      }
    },
    server: true,
    dev: false,
    port: 3015,
  })

  it('sets CORS headers on nuxt assets in production', async () => {
    // Fetch homepage to get asset URLs
    const homeResponse = await fetch('/')
    expect(homeResponse.ok).toBe(true)

    const html = await homeResponse.text()
    const assetMatch = html.match(/\/_nuxt\/([A-Za-z0-9_-]+\.js)/)
    expect(assetMatch).toBeTruthy()

    const assetResponse = await fetch(`/_nuxt/${assetMatch[1]}`)
    const corsOrigin = assetResponse.headers.get('access-control-allow-origin')
    const corsMethod = assetResponse.headers.get('access-control-allow-methods')

    expect(corsOrigin).toBe('http://127.0.0.1:3015')
    expect(corsMethod).toBe('GET')
  })

  it('excludes drupal-* components from index', async () => {
    const json = await $fetch('/nuxt-component-preview/component-index.json')
    const drupalComponents = json.components.filter((c: any) => c.id.startsWith('Drupal'))
    expect(drupalComponents).toHaveLength(0)
  })
})

