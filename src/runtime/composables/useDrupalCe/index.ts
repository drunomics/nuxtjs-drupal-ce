import { defu } from 'defu'
import { appendResponseHeader } from 'h3'
import type { $Fetch, NitroFetchRequest } from 'nitropack'
import { getDrupalBaseUrl, getMenuBaseUrl } from './server'
import type { UseFetchOptions } from '#app'
import { callWithNuxt } from '#app'
import { useRuntimeConfig, useState, useFetch, navigateTo, createError, h, resolveComponent, setResponseStatus, useNuxtApp, useRequestHeaders, ref, watch, useRequestEvent, computed } from '#imports'

export const useDrupalCe = () => {
  const config = useRuntimeConfig().public.drupalCe
  const privateConfig = useRuntimeConfig().drupalCe

  /**
   * Processes the given fetchOptions to apply module defaults
   * @param fetchOptions Optional Nuxt useFetch options
   * @returns UseFetchOptions<any>
   */
  const processFetchOptions = (fetchOptions: UseFetchOptions<any> = {}) => {
    if (config.serverApiProxy) {
      fetchOptions.baseURL = '/api/drupal-ce'
    } else {
      fetchOptions.baseURL = fetchOptions.baseURL ?? getDrupalBaseUrl() + config.ceApiEndpoint
    }
    fetchOptions = defu(fetchOptions, config.fetchOptions)

    // Apply the request headers of current request, if configured.
    if (config.fetchProxyHeaders) {
      fetchOptions.headers = defu(fetchOptions.headers ?? {}, useRequestHeaders(config.fetchProxyHeaders))
    }

    // If fetchOptions.query._content_format is undefined, use config.addRequestContentFormat.
    // If fetchOptions.query._content_format is false, keep that.
    fetchOptions.query = fetchOptions.query ?? {}

    fetchOptions.query._content_format = fetchOptions.query._content_format ?? config.addRequestContentFormat
    if (!fetchOptions.query._content_format) {
      // Remove _content_format if set to a falsy value (e.g. fetchOptions.query._content_format was set to false)
      delete fetchOptions.query._content_format
    }

    if (config.addRequestFormat) {
      fetchOptions.query._format = 'custom_elements'
    }
    return fetchOptions
  }

  /**
   * Custom $fetch instance
   * @param fetchOptions UseFetchOptions<any>
   */
  const $ceApi = (fetchOptions: UseFetchOptions<any> = {}): $Fetch<unknown, NitroFetchRequest> => {
    const useFetchOptions = processFetchOptions(fetchOptions)

    return $fetch.create({
      ...useFetchOptions,
    })
  }

  /**
   * Fetch data from Drupal ce-API endpoint using $ceApi
   * @param path Path of the Drupal ce-API endpoint to fetch
   * @param fetchOptions UseFetchOptions<any>
   * @param passThroughHeaders Whether to pass through headers from Drupal to the client
   */
  const useCeApi = (path: string | Ref<string>, fetchOptions: UseFetchOptions<any> = {}, doPassThroughHeaders?: boolean): Promise<any> => {
    const nuxtApp = useNuxtApp()
    fetchOptions.onResponse = (context) => {
      if (doPassThroughHeaders && import.meta.server && privateConfig?.passThroughHeaders) {
        const headersObject = Object.fromEntries([...context.response.headers.entries()])
        passThroughHeaders(nuxtApp, headersObject)
      }
    }

    return useFetch(path, {
      ...fetchOptions,
      $fetch: $ceApi(fetchOptions),
    })
  }

  /**
   * Returns the API endpoint with localization (if available)
   */
  const getCeApiEndpoint = (localize: boolean = true) => {
    const nuxtApp = useNuxtApp()
    if (localize && nuxtApp.$i18n?.locale && nuxtApp.$i18n.locale.value !== nuxtApp.$i18n.defaultLocale) {
      return `${config.ceApiEndpoint}/${nuxtApp.$i18n.locale.value}`
    }
    return config.ceApiEndpoint
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
        secondary: [],
      },
      settings: {},
      messages: [],
      metatags: {
        meta: [],
        link: [],
        jsonld: [],
      },
      page_layout: 'default',
      title: '',
    }))
    const serverResponse = useState('server-response', () => null)
    useFetchOptions.key = `page-${path}`
    const page = ref(null)
    const pageError = ref(null)

    if (import.meta.server) {
      serverResponse.value = useRequestEvent(nuxtApp).context.drupalCeCustomPageResponse
    }

    // Check if the page data is already provided, e.g. by a form response.
    if (serverResponse.value) {
      if (serverResponse.value._data) {
        page.value = serverResponse.value._data
        passThroughHeaders(nuxtApp, serverResponse.value.headers)
      } else if (serverResponse.value.error) {
        pageError.value = serverResponse.value.error
      }
      // Clear the server response state after it was sent to the client.
      if (import.meta.client) {
        serverResponse.value = null
      }
    } else {
      const { data, error } = await useCeApi(path, useFetchOptions, true)
      page.value = data.value
      pageError.value = error.value
    }

    if (page.value?.messages) {
      pushMessagesToState(page.value.messages)
    }

    if (page?.value?.redirect) {
      await callWithNuxt(nuxtApp, navigateTo, [
        page.value.redirect.url,
        { external: page.value.redirect.external, redirectCode: page.value.redirect.statusCode, replace: true },
      ])
      return pageState
    }

    if (pageError.value) {
      overrideErrorHandler ? overrideErrorHandler(pageError) : pageErrorHandler(pageError, { config, nuxtApp })
      page.value = pageError.value?.data
    }

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
    useFetchOptions.getCachedData = (key) => {
      if (nuxtApp.payload.data[key]) {
        return nuxtApp.payload.data[key]
      }
    }

    const baseMenuPath = config.menuEndpoint.replace('$$$NAME$$$', name)
    const menuPath = ref(baseMenuPath)

    if (config.useLocalizedMenuEndpoint && nuxtApp.$i18n) {
      // API path with localization
      menuPath.value = nuxtApp.$localePath('/' + baseMenuPath)
      watch(nuxtApp.$i18n.locale, () => {
        let menuLocalePath = nuxtApp.$localePath('/' + baseMenuPath)
        // menuPath should not start with a slash.
        if (config.serverApiProxy && menuLocalePath.startsWith('/')) {
          menuLocalePath = menuLocalePath.substring(1)
        }
        menuPath.value = menuLocalePath
      })
    }

    if (config.serverApiProxy) {
      useFetchOptions.baseURL = '/api/menu'
      // menuPath should not start with a slash.
      if (menuPath.value.startsWith('/')) {
        menuPath.value = menuPath.value.substring(1)
      }
    }

    const { data: menu, error } = await useCeApi(menuPath, useFetchOptions)

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

  /**
   * Pass through headers from Drupal to the client
   * @param pageHeaders The headers from the Drupal response
   */
  const passThroughHeaders = (nuxtApp, pageHeaders) => {
    // Only run when SSR context is available.
    if (!nuxtApp.ssrContext) {
      return
    }
    const event = nuxtApp.ssrContext.event
    if (pageHeaders) {
      Object.keys(pageHeaders).forEach((key) => {
        if (privateConfig?.passThroughHeaders.includes(key)) {
          appendResponseHeader(event, key, pageHeaders[key])
        }
      })
    }
  }

  /**
   * Determines the page layout based on the Drupal page data.
   * @param page Ref containing the Drupal page data
   * @returns A computed property resolving to the specified page_layout or 'default' if unspecified.
   */
  const getPageLayout = (page: Ref<any>): ComputedRef<string> => {
    return computed(() => page.value.page_layout || 'default')
  }

  return {
    $ceApi,
    useCeApi,
    fetchPage,
    fetchMenu,
    getMessages,
    getPage,
    renderCustomElements,
    passThroughHeaders,
    getCeApiEndpoint,
    getDrupalBaseUrl,
    getMenuBaseUrl,
    getPageLayout,
  }
}

const pushMessagesToState = (messages) => {
  messages = Object.assign({ success: [], error: [] }, messages)
  const messagesArray = [
    ...messages.error.map(message => ({ type: 'error', message })),
    ...messages.success.map(message => ({ type: 'success', message })),
  ]
  if (!messagesArray.length) {
    return
  }
  import.meta.client && useDrupalCe().getMessages().value.push(...messagesArray)
}

const menuErrorHandler = (error: Record<string, any>) => {
  console.error({ statusCode: error.value.statusCode, statusMessage: error.value.message, data: error.value.data })
  import.meta.client && useDrupalCe().getMessages().value.push({
    type: 'error',
    message: `Menu error: ${error.value.message}.`,
  })
}

const pageErrorHandler = (error: Record<string, any>, context?: Record<string, any>) => {
  const errorData = error.value.data
  if (error.value && (!errorData?.content || context?.config.customErrorPages)) {
    // At the moment, Nuxt API proxy does not provide a nice error when the backend is not reachable. Handle it better.
    // See https://github.com/nuxt/nuxt/issues/22645
    if (error.value.statusCode === 500 && errorData?.message === 'fetch failed' && !errorData.statusMessage) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Unable to reach backend.',
        data: errorData,
        fatal: true,
      })
    }
    throw createError({
      statusCode: error.value.statusCode,
      statusMessage: error.value?.message,
      data: error.value.data,
      fatal: true,
    })
  }
  if (context) {
    callWithNuxt(context.nuxtApp, setResponseStatus, [error.value.statusCode])
  }
}
