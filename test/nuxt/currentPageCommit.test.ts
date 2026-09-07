// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import { useNuxtApp, useRouter, useState } from '#imports'

describe('committed Drupal page state', () => {
  beforeEach(() => {
    const nuxtApp = useNuxtApp()

    registerEndpoint('/api/drupal-ce/destination', () => ({
      title: 'Destination page',
      content: { title: 'Destination content' },
    }))

    nuxtApp.payload.data['page-origin-proxy'] = {
      title: 'Origin page',
      content: { title: 'Origin content' },
    }
    useState<string>('drupal-ce-current-page-key').value = 'page-origin-proxy'
    useState<string>('drupal-ce-pending-page-key').value = ''
  })

  it('keeps the rendered page current until Nuxt commits the destination', async () => {
    const nuxtApp = useNuxtApp()
    const { fetchPage, getPage } = useDrupalCe()
    const currentPage = getPage()

    const destination = await fetchPage('/destination', {
      key: 'page-destination-proxy',
    })

    expect(destination.value.title).toBe('Destination page')
    expect(currentPage.value.title).toBe('Origin page')
    expect(useState<string>('drupal-ce-pending-page-key').value).toBe('page-destination-proxy')

    await nuxtApp.callHook('page:finish')

    expect(currentPage.value.title).toBe('Destination page')
    expect(useState<string>('drupal-ce-pending-page-key').value).toBe('')
  })

  it('does not promote a destination when navigation errors', async () => {
    const nuxtApp = useNuxtApp()
    const { fetchPage, getPage } = useDrupalCe()
    const currentPage = getPage()

    await fetchPage('/destination', {
      key: 'page-failed-destination-proxy',
    })
    await nuxtApp.callHook('app:error', new Error('Navigation failed'))
    await nuxtApp.callHook('page:finish')

    expect(currentPage.value.title).toBe('Origin page')
    expect(useState<string>('drupal-ce-pending-page-key').value).toBe('')
  })

  it('preserves a pending page when a later navigation fails', async () => {
    const nuxtApp = useNuxtApp()
    const router = useRouter()
    const { fetchPage, getPage } = useDrupalCe()
    const currentPage = getPage()

    await router.push('/destination')
    await fetchPage('/destination', {
      key: 'page-destination-proxy',
    })

    expect(useState<string>('drupal-ce-pending-page-key').value).toBe('page-destination-proxy')

    await router.push('/destination')
    await nuxtApp.callHook('page:finish')

    expect(currentPage.value.title).toBe('Destination page')
    expect(useState<string>('drupal-ce-pending-page-key').value).toBe('')
  })

  it('does not let a slower request replace the latest pending page', async () => {
    const nuxtApp = useNuxtApp()
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    let started = false
    registerEndpoint('/api/drupal-ce/slow-page', async () => {
      started = true
      await gate
      return { title: 'Slow page', content: {} }
    })
    const { fetchPage, getPage } = useDrupalCe()
    const currentPage = getPage()
    const slow = fetchPage('/slow-page', { key: 'slow-request' })
    await vi.waitFor(() => expect(started).toBe(true))
    await fetchPage('/destination', { key: 'latest-request' })
    release()
    await slow
    await nuxtApp.callHook('page:finish')
    expect(currentPage.value.title).toBe('Destination page')
  })

  it('does not restore pending state when an in-flight request finishes after app:error', async () => {
    const nuxtApp = useNuxtApp()
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    let started = false
    registerEndpoint('/api/drupal-ce/error-late-page', async () => {
      started = true
      await gate
      return { title: 'Late page', content: {} }
    })
    const { fetchPage, getPage } = useDrupalCe()
    const currentPage = getPage()
    const pending = fetchPage('/error-late-page', { key: 'error-late-request' })
    await vi.waitFor(() => expect(started).toBe(true))
    await nuxtApp.callHook('app:error', new Error('Navigation failed'))
    release()
    await pending
    await nuxtApp.callHook('page:finish')
    expect(currentPage.value.title).toBe('Origin page')
  })

  it('never promotes a cached redirect payload', async () => {
    const nuxtApp = useNuxtApp()
    const { getPage } = useDrupalCe()
    const currentPage = getPage()
    nuxtApp.payload.data['cached-redirect'] = { redirect: { url: '/destination', statusCode: 302 } }
    useState<string>('drupal-ce-pending-page-key').value = 'cached-redirect'
    await nuxtApp.callHook('page:finish')
    expect(currentPage.value.title).toBe('Origin page')
  })


  it('preserves a custom pending key through hash-only navigation', async () => {
    const nuxtApp = useNuxtApp()
    const router = useRouter()
    await router.push('/destination')
    const { fetchPage, getPage } = useDrupalCe()
    const currentPage = getPage()
    await fetchPage('/destination', { key: 'custom-hash-page' })
    await router.push('/destination#section')
    await nuxtApp.callHook('page:finish')
    expect(currentPage.value.title).toBe('Destination page')
    expect(currentPage.value.key).toBe('custom-hash-page')
  })

  it('preserves the pending page when a guard aborts another navigation', async () => {
    const nuxtApp = useNuxtApp()
    const router = useRouter()
    await router.push('/destination')
    const { fetchPage, getPage } = useDrupalCe()
    const currentPage = getPage()
    await fetchPage('/destination', { key: 'guard-pending-page' })
    const removeGuard = router.beforeEach(to => to.path === '/blocked' ? false : undefined)
    try {
      await router.push('/blocked')
      await nuxtApp.callHook('page:finish')
      expect(currentPage.value.title).toBe('Destination page')
    }
    finally {
      removeGuard()
    }
  })

  it('promotes cached pages on return without another fetch', async () => {
    const nuxtApp = useNuxtApp()
    const router = useRouter()
    const { getPage } = useDrupalCe()
    const currentPage = getPage()
    nuxtApp.payload.data['page-/cached-return-proxy'] = { title: 'Cached page', content: {} }
    await router.push('/cached-return')
    expect(currentPage.value.title).toBe('Origin page')
    await nuxtApp.callHook('page:finish')
    expect(currentPage.value.title).toBe('Cached page')
  })

})
