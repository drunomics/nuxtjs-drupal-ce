import { callWithNuxt } from '#app'
import { useRuntimeConfig, useState, useFetch, navigateTo, createError, useRoute, h, resolveComponent, setResponseStatus, useNuxtApp } from '#imports'
export const useDrupalCe = () => {
  /**
   * Fetches page data from Drupal, handles redirects, errors and messages
   * @param path Path of the Drupal page to fetch
   * @param useFetchOptions Optional Nuxt useFetch options
   */
  const fetchPage = async (path: string, useFetchOptions = {}) => {
    const nuxtApp = useNuxtApp()
    const config = useRuntimeConfig()
    const baseURL = config.public.drupalCe.baseURL

    // Workaround for issue - useState is not available after async call (Nuxt instance unavailable)
    const pageState = useState(`page-${path}`, () => {})

    useFetchOptions.query = useFetchOptions.query ?? {}
    useFetchOptions.key = `page-${path}`
    useFetchOptions.baseURL = baseURL

    if (config.public.drupalCe.addRequestContentFormat) {
      useFetchOptions.query.addRequestContentFormat = config.public.drupalCe.addRequestContentFormat
    }

    const { data: page, error } = await useFetch(path, useFetchOptions)

    if (page?.value?.redirect) {
      await navigateTo(page.value.redirect.url, {
        external: page.value.redirect.external,
        redirectCode: page.value.redirect.statusCode
      })
      return
    }

    if (error.value && !error.value?.data?.content) {
      throw createError({ statusCode: error.value.status, statusMessage: error.value.message, fatal: true })
    }

    if (error.value) {
      callWithNuxt(nuxtApp, setResponseStatus, [error.value.status])
      page.value = error.value?.data
    }

    page.value?.messages && pushMessagesToState(page.value.messages)

    pageState.value = page
    return page
  }

  /**
   * Fetches menu data from Drupal (configured by menuEndpoint option), handles errors
   * @param name Menu name being fetched
   */
  const fetchMenu = async (name: string) => {
    const config = useRuntimeConfig()
    const baseURL = config.public.drupalCe.baseURL
    const menuEndpoint = config.public.drupalCe.menuEndpoint
    const menuPath = menuEndpoint.replace('$$$NAME$$$', name)

    const { data: menu, error } = await useFetch(menuPath, {
      key: `menu-${name}`,
      baseURL
    })

    if (error.value) {
      errorMenuHandler(error)
      return
    }

    return menu
  }

  /**
   * Use messages state
   */
  const getMessages = () => useState('drupal-ce-messages', () => [])

  /**
   * Use page data
   */
  const getPage = () => useState(`page-${useRoute().path}`)

  /**
   * Render elements from page data returned from fetchPage
   * @param customElement
   */
  const renderCustomElements = (customElement) => {
    return h(resolveComponent(customElement.element), customElement)
  }

  return {
    fetchPage,
    fetchMenu,
    getMessages,
    getPage,
    renderCustomElements,
  }
}

const pushMessagesToState = (messages) => {
  messages = Object.assign({ success: [], error: [] }, messages)
  const messagesArray = [
    ...messages.error.map(message => ({ type: 'error', message })),
    ...messages.success.map(message => ({ type: 'success', message }))
  ]
  if (!messagesArray.length) {
    return
  }
  process.client && useDrupalCe().getMessages().value.push(...messagesArray)
}

const errorMenuHandler = (error) => {
  process.client && useDrupalCe().getMessages().value.push({
    type: 'error',
    message: `Menu error: ${error.value.message}.`
  })
}
