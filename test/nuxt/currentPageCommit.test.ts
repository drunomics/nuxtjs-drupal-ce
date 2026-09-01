// @vitest-environment nuxt
import { beforeEach, describe, expect, it } from 'vitest'
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
    useState<boolean>('drupal-ce-watcher-init').value = false
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
})
