// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'

describe('useDrupalCe', () => {
  beforeEach(() => {
    registerEndpoint('/api/drupal-ce/test-page', () => ({
      content: { title: 'Via Proxy' }
    }))
    registerEndpoint('http://127.0.0.1:3001/api/test-page', () => ({
      content: { title: 'Direct API' }
    }))
    registerEndpoint('/api/menu/api/menu_items/main', () => ({
      items: [{ title: 'Via Proxy Menu' }]
    }))
    registerEndpoint('http://127.0.0.1:3001/api/api/menu_items/main', () => ({
      items: [{ title: 'Direct API Menu' }]
    }))
  })

  describe('fetchPage', () => {
    it('uses proxy by default', async () => {
      const { fetchPage } = useDrupalCe()
      const result = await fetchPage('/test-page')
      expect(result.value?.content?.title).toBe('Via Proxy')
    })

    it('skips proxy when skipDrupalCeApiProxy is true', async () => {
      const { fetchPage } = useDrupalCe()
      const result = await fetchPage('/test-page', {}, undefined, true)
      expect(result.value?.content?.title).toBe('Direct API')
    })
  })

  describe('fetchMenu', () => {
    it('uses proxy by default', async () => {
      const { fetchMenu } = useDrupalCe()
      const result = await fetchMenu('main')
      expect(result.value?.items?.[0]?.title).toBe('Via Proxy Menu')
    })

    it('skips proxy when skipDrupalCeApiProxy is true', async () => {
      const { fetchMenu } = useDrupalCe()
      // Customize the cache key to prevent using the cache of previous test cases
      const result = await fetchMenu('main', { key: 'main-without-proxy' }, undefined, true)
      expect(result.value?.items?.[0]?.title).toBe('Direct API Menu')
    })
  })
})
