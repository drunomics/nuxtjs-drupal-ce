import { callWithNuxt } from '#app'
import { defu } from 'defu'
import { useRuntimeConfig, useState, useFetch, navigateTo, createError, h, resolveComponent, setResponseStatus, useNuxtApp, useRequestHeaders, UseFetchOptions, ref, watch } from '#imports'

export const useDrupalCe = () => {

  const config = useRuntimeConfig().public.drupalCe

  /**
   * Processes the given fetchOptions to apply module defaults
   * @param fetchOptions Optional Nuxt useFetch options
   * @returns UseFetchOptions<any>
   */
  const processFetchOptions = (fetchOptions:UseFetchOptions<any> = {}) => {
    if (config.exposeAPIRouteRules) {
      fetchOptions.baseURL = useRequestURL().origin + '/api/drupal-ce'
    } else {
      fetchOptions.baseURL = fetchOptions.baseURL ?? config.baseURL
    }
    fetchOptions = defu(fetchOptions, config.fetchOptions)

    // Apply the request headers of current request, if configured.
    if (config.fetchProxyHeaders) {
      fetchOptions.headers = defu(fetchOptions.headers ?? {}, useRequestHeaders(config.fetchProxyHeaders))
    }
    return fetchOptions
  }

  /**
   * Fetches page data from Drupal, handles redirects, errors and messages
   * @param path Path of the Drupal page to fetch
   * @param useFetchOptions Optional Nuxt useFetch options
   */
  const fetchPage = async (path: string, useFetchOptions: UseFetchOptions<any> = {}, overrideErrorHandler?: (error?: any) => void) => {
    const nuxtApp = useNuxtApp()

    // Workaround for issue - useState is not available after async call (Nuxt instance unavailable)
    // Initialize state with default values
    const pageState = useState('drupal-ce-page-data', () => ({
      breadcrumbs: [],
      content: {},
      content_format: 'json',
      local_tasks: {
        primary: [],
        secondary: []
      },
      messages: [],
      metatags: {
        meta: [],
        link: [],
        jsonld: []
      },
      page_layout: 'default',
      title: ''
    }))
    useFetchOptions.key = `page-${path}`
    useFetchOptions = processFetchOptions(useFetchOptions)
    useFetchOptions.query = useFetchOptions.query ?? {}

    if (config.addRequestContentFormat) {
      useFetchOptions.query._content_format = config.addRequestContentFormat
    }

    if (config.addRequestFormat) {
      useFetchOptions.query._format = 'custom_elements'
    }

    const { data: page, error } = await useFetch(path, useFetchOptions)

    if (page?.value?.redirect) {
      await callWithNuxt(nuxtApp, navigateTo, [
        page.value.redirect.url,
        { external: page.value.redirect.external, redirectCode: page.value.redirect.statusCode, replace: true }
      ])
      return pageState
    }

    if (error.value) {
      overrideErrorHandler ? overrideErrorHandler(error) : pageErrorHandler(error, { config, nuxtApp })
      page.value = error.value?.data
    }

    page.value?.messages && pushMessagesToState(page.value.messages)

    pageState.value = page
    return page
  }

  /**
   * Fetches menu data from Drupal (configured by menuEndpoint option), handles errors
   * @param name Menu name being fetched
   * @param useFetchOptions Optional Nuxt useFetch options
   */
  const fetchMenu = async (name: string, useFetchOptions: UseFetchOptions<any> = {}, overrideErrorHandler?: (error?: any) => void) => {
    const nuxtApp = useNuxtApp()
    useFetchOptions = processFetchOptions(useFetchOptions)
    useFetchOptions.key = `menu-${name}`

    const baseMenuPath = config.menuEndpoint.replace('$$$NAME$$$', name)
    const menuPath = ref(baseMenuPath)

    if (config.useLocalizedMenuEndpoint && nuxtApp.$i18n) {
      // API path with localization
      menuPath.value = nuxtApp.$localePath('/' + baseMenuPath)
      watch(nuxtApp.$i18n.locale, () => {
        menuPath.value = nuxtApp.$localePath('/' + baseMenuPath)
      })
    }

    const { data: menu, error } = await useFetch(menuPath, useFetchOptions)

    if (error.value) {
      overrideErrorHandler ? overrideErrorHandler(error) : menuErrorHandler(error)
    }
    return menu
  }

  /**
   * Use messages state
   */
  const getMessages = (): Ref => useState('drupal-ce-messages', () => [])

  /**
   * Use page data
   */
  const getPage = (): Ref => useState('drupal-ce-page-data', () => ({}))

  /**
   * Render elements from page data returned from fetchPage
   * @param customElements
   */
  const renderCustomElements = (customElements: Record<string, any> | Array<Object>) => {
    if (Object.keys(customElements).length === 0) {
      return
    }
    return Array.isArray(customElements)
      ? h('div', customElements.map(customElement => h(resolveComponent(customElement.element), customElement)))
      : h(resolveComponent(customElements.element), customElements)
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

const menuErrorHandler = (error: Record<string, any>) => {
  console.error({ statusCode: error.value.statusCode, statusMessage: error.value.message, data: error.value.data })
  process.client && useDrupalCe().getMessages().value.push({
    type: 'error',
    message: `Menu error: ${error.value.message}.`
  })
}

const pageErrorHandler = (error: Record<string, any>, context: Record<string, any>) => {
  if (error.value && (!error.value?.data?.content || context.config.customErrorPages)) {
    throw createError({ statusCode: error.value.statusCode, statusMessage: error.value.message, data: error.value.data, fatal: true })
  }
  callWithNuxt(context.nuxtApp, setResponseStatus, [error.value.statusCode])
}
