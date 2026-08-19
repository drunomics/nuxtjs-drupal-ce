// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import { useNuxtApp } from '#imports'
import { ref } from 'vue'

describe('fetchPage and fetchMenu use the right API endpoints', () => {
  beforeEach(() => {
    const nuxtApp = useNuxtApp()
    nuxtApp.$i18n = undefined
    nuxtApp.$localePath = undefined

    // Register endpoints
    registerEndpoint('/api/drupal-ce/test-page', () => ({
      content: { title: 'Via Proxy' }
    }))
    registerEndpoint('http://127.0.0.1:3021/ce-api/test-page', () => ({
      content: { title: 'Direct API' }
    }))
    registerEndpoint('/api/menu/api/menu_items/main', () => ({
      items: [{ title: 'Via Proxy Menu' }]
    }))
    registerEndpoint('http://127.0.0.1:3021/ce-api/api/menu_items/main', () => ({
      items: [{ title: 'Direct API Menu' }]
    }))
  })

  describe('fetchPage', () => {
    it('uses proxy by default', async () => {
      const { fetchPage } = useDrupalCe()
      const result = await fetchPage('/test-page')
      expect(result.value?.content?.title).toBe('Via Proxy')
    })

    it('skips proxy', async () => {
      const { fetchPage } = useDrupalCe()
      const result = await fetchPage('/test-page', {}, undefined, true)
      expect(result.value?.content?.title).toBe('Direct API')
    })
  })

  describe('fetchMenu', () => {
    describe('without i18n', () => {
      it('uses proxy by default', async () => {
        const { fetchMenu } = useDrupalCe()
        const result = await fetchMenu('main')
        expect(result.value?.items?.[0]?.title).toBe('Via Proxy Menu')
      })

      it('skips proxy', async () => {
        const { fetchMenu } = useDrupalCe()
        const result = await fetchMenu('main', { key: 'main-direct' }, undefined, true)
        expect(result.value?.items?.[0]?.title).toBe('Direct API Menu')
      })
    })

    describe('with i18n', () => {
      beforeEach(() => {
        const nuxtApp = useNuxtApp()
        // Mock i18n
        nuxtApp.$i18n = {
          locale: ref('fr'),
          defaultLocale: 'en'
        }
        nuxtApp.$localePath = (path: string) => `/fr${path}`

        // Register localized endpoints
        registerEndpoint('/api/menu/fr/api/menu_items/main', () => ({
          items: [{ title: 'Via Proxy Menu FR' }]
        }))
        registerEndpoint('http://127.0.0.1:3021/ce-api/fr/api/menu_items/main', () => ({
          items: [{ title: 'Direct API Menu FR' }]
        }))
      })

      it('uses proxy with localized path', async () => {
        const { fetchMenu } = useDrupalCe()
        const result = await fetchMenu('main', { key: 'main-localized-proxy' })
        expect(result.value?.items?.[0]?.title).toBe('Via Proxy Menu FR')
      })

      it('skips proxy with localized path', async () => {
        const { fetchMenu } = useDrupalCe()
        const result = await fetchMenu('main', { key: 'main-localized-direct' }, undefined, true)
        expect(result.value?.items?.[0]?.title).toBe('Direct API Menu FR')
      })

      it('refetches the menu when the locale changes', async () => {
        const nuxtApp = useNuxtApp()
        const locale = ref('en')
        nuxtApp.$i18n = { locale, defaultLocale: 'en' }
        nuxtApp.$localePath = (path: string) => locale.value === 'en' ? path : `/${locale.value}${path}`

        const { fetchMenu } = useDrupalCe()
        const result = await fetchMenu('main')
        expect(result.value?.items?.[0]?.title).toBe('Via Proxy Menu')

        locale.value = 'fr'
        await vi.waitFor(() => {
          expect(result.value?.items?.[0]?.title).toBe('Via Proxy Menu FR')
        })
      })
    })
  })

  describe('useMenu', () => {
    it('supports a deferred request executed later in the component lifecycle', async () => {
      const { useMenu } = useDrupalCe()
      const { data, execute } = useMenu('main', {
        immediate: false,
        key: 'main-deferred',
      })

      expect(data.value).toBeUndefined()

      await execute()

      expect(data.value?.items?.[0]?.title).toBe('Via Proxy Menu')
    })
  })
})
