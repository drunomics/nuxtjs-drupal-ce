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

  /**
   * Finds the URL of a built nuxt JS asset on the current homepage.
   */
  async function findAssetPath(): Promise<string> {
    const homeResponse = await fetch('/')
    expect(homeResponse.ok).toBe(true)
    const html = await homeResponse.text()
    const assetMatch = html.match(/\/_nuxt\/([A-Za-z0-9_-]+\.js)/)
    expect(assetMatch).toBeTruthy()
    return `/_nuxt/${assetMatch![1]}`
  }

  /**
   * Parses a Vary header value into a lowercased token set.
   */
  function parseVary(headerValue: string | null): Set<string> {
    return new Set(
      (headerValue ?? '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean),
    )
  }

  it('sets Vary: Origin on responses without an Origin request header', async () => {
    const assetPath = await findAssetPath()

    // No Origin header at all - response must still advertise that it varies
    // on Origin so downstream caches don't reuse this response for cross-origin
    // requests that would need CORS headers attached.
    const response = await fetch(assetPath)

    expect(parseVary(response.headers.get('vary'))).toContain('origin')
    // And of course no CORS headers, because there was no Origin to match.
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('merges Vary: Origin with any existing Vary tokens (e.g. Accept-Encoding)', async () => {
    const assetPath = await findAssetPath()

    // Static JS assets are typically served with Vary: Accept-Encoding by the
    // compression middleware. The CORS plugin must append Origin instead of
    // overwriting the existing tokens.
    const response = await fetch(assetPath, {
      headers: { 'Accept-Encoding': 'gzip' },
    })
    const varyTokens = parseVary(response.headers.get('vary'))

    expect(varyTokens).toContain('origin')
    expect(varyTokens).toContain('accept-encoding')
  })

  it('sets CORS and Vary headers on nuxt assets when Origin matches drupalBaseUrl', async () => {
    const assetPath = await findAssetPath()

    // Simulate a cross-origin request from the Drupal backend.
    const assetResponse = await fetch(assetPath, {
      headers: { Origin: 'http://127.0.0.1:3015' },
    })

    expect(assetResponse.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:3015')
    expect(assetResponse.headers.get('access-control-allow-methods')).toBe('GET')
    expect(assetResponse.headers.get('access-control-allow-credentials')).toBe('true')
    expect(parseVary(assetResponse.headers.get('vary'))).toContain('origin')
  })

  it('sets Vary: Origin but no Access-Control-Allow-Origin when Origin does not match', async () => {
    const assetPath = await findAssetPath()

    // Simulate a cross-origin request from an unrelated origin. The plugin
    // must still advertise Vary: Origin (so a cached "no CORS" response is not
    // served to a matching-origin request), but it must NOT grant CORS.
    const response = await fetch(assetPath, {
      headers: { Origin: 'http://evil.example.com' },
    })

    expect(parseVary(response.headers.get('vary'))).toContain('origin')
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
    expect(response.headers.get('access-control-allow-methods')).toBeNull()
    expect(response.headers.get('access-control-allow-credentials')).toBeNull()
  })

  it('excludes drupal-* components from index', async () => {
    const json = await $fetch('/nuxt-component-preview/component-index.json')
    const drupalComponents = json.components.filter((c: any) => c.id.startsWith('Drupal'))
    expect(drupalComponents).toHaveLength(0)
  })
})

