import { defu } from 'defu'
import { appendResponseHeader } from 'h3'
import type { $Fetch, NitroFetchRequest } from 'nitropack'
import type { Ref, ComputedRef, Component } from 'vue'
import { getDrupalBaseUrl, getMenuBaseUrl } from './server'
import type { UseFetchOptions } from '#app'
import { callWithNuxt } from '#app'
import { useRuntimeConfig, useState, useFetch, navigateTo, createError, h, resolveComponent, setResponseStatus, useNuxtApp, useRequestHeaders, ref, watch, useRequestEvent, computed, useHead, defineComponent } from '#imports'

export const useDrupalCe = () => {
  const config = useRuntimeConfig().public.drupalCe
  const privateConfig = useRuntimeConfig().drupalCe

  /**
   * Processes the given fetchOptions to apply module defaults
   * @param fetchOptions Optional Nuxt useFetch options
   * @param skipDrupalCeApiProxy Force skip the Drupal CE API proxy. Defaults to false.
   *                            The proxy might still be skipped if serverApiProxy is set to false globally.
   * @returns UseFetchOptions<any>
   */
  const processFetchOptions = (fetchOptions: UseFetchOptions<any> = {}, skipDrupalCeApiProxy: boolean = false) => {
    if (config.serverApiProxy && !skipDrupalCeApiProxy) {
      fetchOptions.baseURL = '/api/drupal-ce'
    }
    else {
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
   * @param skipDrupalCeApiProxy Force skip the Drupal CE API proxy. Defaults to false.
   */
  const $ceApi = (fetchOptions: UseFetchOptions<any> = {}, skipDrupalCeApiProxy: boolean = false): $Fetch<unknown, NitroFetchRequest> => {
    const useFetchOptions = processFetchOptions(fetchOptions, skipDrupalCeApiProxy)

    return $fetch.create({
      ...useFetchOptions,
    })
  }

  /**
   * Fetch data from Drupal ce-API endpoint using $ceApi
   * @param path Path of the Drupal ce-API endpoint to fetch
   * @param fetchOptions UseFetchOptions<any>
   * @param doPassThroughHeaders Whether to pass through headers from Drupal to the client
   * @param skipDrupalCeApiProxy Force skip the Drupal CE API proxy. Defaults to false.
   */
  const useCeApi = (path: string | Ref<string>, fetchOptions: UseFetchOptions<any> = {}, doPassThroughHeaders?: boolean, skipDrupalCeApiProxy: boolean = false): Promise<any> => {
    const nuxtApp = useNuxtApp()
    fetchOptions.onResponse = (context) => {
      if (doPassThroughHeaders && import.meta.server && privateConfig?.passThroughHeaders) {
        const headersObject = Object.fromEntries([...context.response.headers.entries()])
        passThroughHeaders(nuxtApp, headersObject)
      }
    }

    return useFetch(path, {
      ...fetchOptions,
      $fetch: $ceApi(fetchOptions, skipDrupalCeApiProxy),
    })
  }

  /**
   * Returns the API endpoint with localization (if available)
   */
  const getCeApiEndpoint = (localize: boolean = true) => {
    const nuxtApp = useNuxtApp()
    if (localize && nuxtApp.$i18n?.locale?.value && nuxtApp.$i18n.locale.value !== nuxtApp.$i18n.defaultLocale) {
      return `${config.ceApiEndpoint}/${nuxtApp.$i18n.locale.value}`
    }
    return config.ceApiEndpoint
  }

  /**
   * Fetches page data from Drupal, handles redirects, errors and messages
   * @param path Path of the Drupal page to fetch
   * @param useFetchOptions Optional Nuxt useFetch options
   * @param overrideErrorHandler Optional error handler
   * @param skipDrupalCeApiProxy Force skip the Drupal CE API proxy. Defaults to false.
   *                             The proxy might still be skipped if serverApiProxy is set to false globally.
   */
  const fetchPage = async (path: string, useFetchOptions: UseFetchOptions<any> = {}, overrideErrorHandler?: (error?: any) => void, skipDrupalCeApiProxy: boolean = false) => {
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
    // Remove trailing slash from path key as it might cause issues in SSG.
    const sanitizedPathKey = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path
    const params =
      Object.keys(useFetchOptions.query || {}).length > 0
        ? `?${new URLSearchParams(unref(useFetchOptions.query)).toString()}`
        : ''
    useFetchOptions.key = `page-${sanitizedPathKey}${params}${skipDrupalCeApiProxy ? '-direct' : '-proxy'}`
    let page = null
    const pageError = ref(null)

    if (import.meta.server) {
      serverResponse.value = useRequestEvent(nuxtApp).context.drupalCeCustomPageResponse
    }

    // Check if the page data is already provided, e.g. by a form response.
    if (serverResponse.value) {
      if (serverResponse.value._data) {
        page = ref(serverResponse.value._data)
        passThroughHeaders(nuxtApp, serverResponse.value.headers)
      }
      else if (serverResponse.value.error) {
        pageError.value = serverResponse.value.error
      }
      // Clear the server response state after it was sent to the client.
      if (import.meta.client) {
        serverResponse.value = null
      }
    }
    else {
      const { data, error } = await useCeApi(path, useFetchOptions, true, skipDrupalCeApiProxy)
      page = data
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
   * @param overrideErrorHandler Optional error handler
   * @param skipDrupalCeApiProxy Force skip the Drupal CE API proxy. Defaults to false.
   *                             The proxy might still be skipped if serverApiProxy is set to false globally.
   */
  const fetchMenu = async (name: string, useFetchOptions: UseFetchOptions<any> = {}, overrideErrorHandler?: (error?: any) => void, skipDrupalCeApiProxy: boolean = false) => {
    const nuxtApp = useNuxtApp()
    useFetchOptions = processFetchOptions(useFetchOptions)
    useFetchOptions.key = useFetchOptions.key || `menu-${name}`
    useFetchOptions.getCachedData = (key) => {
      if (nuxtApp.payload.data[key]) {
        return nuxtApp.payload.data[key]
      }
    }

    const baseMenuPath = config.menuEndpoint.replace('$$$NAME$$$', name)
    const menuPath = ref(baseMenuPath)

    // Ensure menuPath has no leading slash
    const sanitizeMenuPath = (path: string) => path.startsWith('/') ? path.substring(1) : path

    if (config.useLocalizedMenuEndpoint && nuxtApp.$i18n) {
      // API path with localization
      menuPath.value = sanitizeMenuPath(nuxtApp.$localePath('/' + baseMenuPath))
      watch(nuxtApp.$i18n.locale, () => {
        menuPath.value = sanitizeMenuPath(nuxtApp.$localePath('/' + baseMenuPath))
      })
    }
    else {
      menuPath.value = sanitizeMenuPath(menuPath.value)
    }

    // Override baseURL specifically for menu endpoints
    if (config.serverApiProxy && !skipDrupalCeApiProxy) {
      useFetchOptions.baseURL = '/api/menu'
    }
    else {
      useFetchOptions.baseURL = getDrupalBaseUrl() + getCeApiEndpoint(false)
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
   * Resolve a custom element into a Vue component
   * @param element The custom element name to resolve
   */
  const resolveCustomElement = (element: string) => {
    const nuxtApp = useNuxtApp()
    const formatName = (name: string) => name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')

    // Try resolving the full component name.
    const component = nuxtApp.vueApp.component(formatName(element))
    if (typeof component === 'object' && component.name) {
      return component
    }

    // Progressively remove segments from the custom element name to find a matching default component.
    const regex = /-?[a-z]+$/
    let componentName = element
    while (componentName) {
      // Try resolving by adding 'Default' suffix.
      const fallbackComponent = nuxtApp.vueApp.component(formatName(componentName) + 'Default')
      if (typeof fallbackComponent === 'object' && fallbackComponent.name) {
        return fallbackComponent
      }
      componentName = componentName.replace(regex, '')
    }

    // If not found, try with resolveComponent. This provides a warning if the component is not found.
    return typeof resolveComponent(element) === 'object' ? resolveComponent(element) : null
  }

  /**
   * Renders Vue components from JSON-serialized custom element data.
   *
   * @param customElements - Custom element data that can be:
   *   - null/undefined (returns null, skipping render)
   *   - string (rendered inside a wrapping div element)
   *   - single custom element object with {element: string, ...props}
   *   - array of strings or custom element objects (rendered inside a wrapping div element)
   * @returns Component | null - A Vue component that can be used with <component :is="component" />.
   *          Returns null for skipped render, otherwise returns a Vue component
   *          (either a custom element component or a wrapping div component for strings/arrays).
   */
  const renderCustomElements = (
    customElements: null | undefined | string | Record<string, any> | Array<string | object>,
  ): Component | null => {
    // Handle null/undefined case
    if (customElements == null) {
      return null
    }

    // Handle string case by creating a component that renders HTML content
    if (typeof customElements === 'string') {
      const component = resolveCustomElement('drupal-markup')
      if (component) {
        return h(component, {content: customElements})
      }
      // Else fallback to a simple wrapping div.
      return h('div', customElements)
    }

    // Handle empty object case
    if (Object.keys(customElements).length === 0) {
      return null
    }

    // Handle multiple elements without creating a wrapping div
    if (Array.isArray(customElements)) {
      return defineComponent({
        setup() {
          return () => customElements.map(element => {
            const rendered = renderCustomElements(element)
            return rendered ? h(rendered) : null
          })
        }
      })
    }

    // Handle single custom element object
    const resolvedElement = resolveCustomElement(customElements.element)
    return resolvedElement ? h(resolvedElement, customElements) : null
  }

  /**
   * Pass through headers from Drupal to the client
   * @param nuxtApp The Nuxt app instance
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
   * Sets page head metadata from Drupal page data
   * @param page Ref containing the Drupal page data
   * @param include Optional array of parts to include: 'title', 'meta', 'link', 'jsonld'
   */
  const usePageHead = (page: Ref<any>, include?: Array<'title' | 'meta' | 'link' | 'jsonld'>) => {
    const parts = include || ['title', 'meta', 'link', 'jsonld']
    useHead({
      ...(parts.includes('title') && { title: page.value.title }),
      ...(parts.includes('meta') && { meta: page.value.metatags.meta }),
      ...(parts.includes('link') && { link: page.value.metatags.link }),
      ...(parts.includes('jsonld') && { script: [{
        type: 'application/ld+json',
        children: JSON.stringify(page.value.metatags.jsonld || [], null, ''),
      }] }),
    })
  }

  /**
   * Gets the current page layout.
   * @param page Optional Ref containing the Drupal page data. If not provided, gets data from global state.
   * @returns ComputedRef resolving to the current layout name
   */
  const getPageLayout = (page?: Ref<any>): ComputedRef<string> => {
    const pageData = page || getPage()
    return computed(() => pageData.value?.page_layout || 'default')
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
    usePageHead,
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
