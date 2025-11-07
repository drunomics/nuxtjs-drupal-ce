import { defu } from 'defu'
import { appendResponseHeader } from 'h3'
import type { $Fetch, NitroFetchRequest } from 'nitropack'
import type { Ref, ComputedRef, Component, VNode } from 'vue'
import { getDrupalBaseUrl, getMenuBaseUrl } from './server'
import type { UseFetchOptions, AsyncData } from '#app'
import { callWithNuxt } from '#app'
import { useRuntimeConfig, useState, useFetch, navigateTo, createError, h, resolveComponent, setResponseStatus, useNuxtApp, useRequestHeaders, ref, unref, watch, useRequestEvent, computed, useHead, defineComponent, toRef } from '#imports'
import type { DrupalCePage, DrupalCeApiResponse } from '../../types'

export const useDrupalCe = () => {
  const config = useRuntimeConfig().public.drupalCe
  const privateConfig = import.meta.server && useRuntimeConfig().drupalCe

  /**
   * Returns an empty page structure with default values
   */
  const createEmptyPage = (): DrupalCePage => ({
    breadcrumbs: [],
    content: {},
    content_format: 'json',
    local_tasks: { primary: [], secondary: [] },
    settings: {},
    messages: [],
    metatags: { meta: [], link: [], jsonld: [] },
    page_layout: 'default',
    title: '',
  })

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
   * @returns AsyncData<DrupalCeApiResponse> - The API response can be either a page object or a redirect object
   */
  const useCeApi = (path: string | Ref<string>, fetchOptions: UseFetchOptions<any> = {}, doPassThroughHeaders?: boolean, skipDrupalCeApiProxy: boolean = false): AsyncData<DrupalCeApiResponse, any> => {
    const nuxtApp = useNuxtApp()
    fetchOptions.onResponse = (context) => {
      if (doPassThroughHeaders && import.meta.server && privateConfig?.passThroughHeaders) {
        const headersObject = Object.fromEntries([...context.response.headers.entries()])
        passThroughHeaders(nuxtApp, headersObject)
      }
    }

    return useFetch<DrupalCeApiResponse>(path, {
      ...processFetchOptions(fetchOptions, skipDrupalCeApiProxy),
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
  const fetchPage = async (path: string, useFetchOptions: UseFetchOptions<any> = {}, overrideErrorHandler?: (error?: any) => void, skipDrupalCeApiProxy: boolean = false): Promise<Ref<DrupalCePage>> => {
    const nuxtApp = useNuxtApp()
    const currentPageKey = useState<string>('drupal-ce-current-page-key')

    // Remove trailing slash from path key as it might cause issues in SSG.
    const sanitizedPathKey = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path
    const params =
      Object.keys(useFetchOptions.query || {}).length > 0
        ? `?${new URLSearchParams(unref(useFetchOptions.query)).toString()}`
        : ''
    useFetchOptions.key = `page-${sanitizedPathKey}${params}${skipDrupalCeApiProxy ? '-direct' : '-proxy'}`

    // Check if page data is provided by custom page response (e.g. form submission via POST)
    // This is only available during SSR
    const customPageResponse = import.meta.server
      ? useRequestEvent(nuxtApp).context.drupalCeCustomPageResponse
      : null

    // Get page data and result ref - either from customPageResponse or API
    let page: any
    let error: any
    let dataRef: Ref<DrupalCePage>

    if (customPageResponse) {
      // Custom response path: skip API call, use provided data
      page = customPageResponse._data
      error = customPageResponse.error

      if (customPageResponse._data) {
        passThroughHeaders(nuxtApp, customPageResponse.headers)
      }

      // Create ref that will be linked to cache after processing
      dataRef = toRef(nuxtApp.payload.data, useFetchOptions.key)
    }
    else {
      // Normal path: fetch from API
      const result = await useCeApi(path, useFetchOptions, true, skipDrupalCeApiProxy)
      page = result.data.value
      error = result.error.value
      dataRef = result.data
    }

    if (page?.messages) {
      pushMessagesToState(page.messages)
    }

    if (page?.redirect) {
      await callWithNuxt(nuxtApp, navigateTo, [
        page.redirect.url,
        { external: page.redirect.external, redirectCode: page.redirect.statusCode, replace: true },
      ])
      // Redirect aborts rendering - replace with empty page structure
      dataRef.value = createEmptyPage()
      currentPageKey.value = useFetchOptions.key
      return dataRef
    }

    if (error) {
      const errorData = error.data

      // Validate that error response has complete page structure
      const isValidPageStructure = errorData &&
        typeof errorData.title === 'string' &&
        typeof errorData.content === 'object' &&
        typeof errorData.metatags === 'object'

      if (!isValidPageStructure || config.customErrorPages) {
        (overrideErrorHandler || pageErrorHandler)({ value: error }, { config, nuxtApp })
      }
      else {
        // Backend returned a complete custom error page
        dataRef.value = {
          ...errorData,
          key: useFetchOptions.key,
        }

        if (import.meta.server) {
          callWithNuxt(nuxtApp, setResponseStatus, [error.statusCode])
        }
      }
    }
    else if (page) {
      // Store successful page data
      dataRef.value = {
        ...page,
        key: useFetchOptions.key,
      }
    }

    // Store the current page key for getPage() lookup
    currentPageKey.value = useFetchOptions.key

    return dataRef
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
   * Get the current page data ref.
   * Returns the useFetch cached data for the current page.
   * Layout components (breadcrumbs, page title, social share, etc.) can use this to access page data from the current route.
   */
  const getPage = (): Ref<DrupalCePage> => {
    const currentPageKey = useState<string>('drupal-ce-current-page-key', () => '')

    // Return computed ref that looks up the current page key in the reactive Nuxt payload
    // This properly tracks reactivity since nuxtApp.payload.data is reactive
    return computed(() => {
      const nuxtApp = useNuxtApp()
      const key = currentPageKey.value
      if (key && nuxtApp.payload.data[key]) {
        return nuxtApp.payload.data[key]
      }
      // Return empty page data if no page has been fetched yet
      return createEmptyPage()
    })
  }

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
    const regex = /-?[^-]+$/
    let componentName = element
    while (componentName) {
      // Try resolving by adding 'Default' suffix.
      const fallbackComponent = nuxtApp.vueApp.component(formatName(componentName) + 'Default')
      if (typeof fallbackComponent === 'object' && fallbackComponent.name) {
        return fallbackComponent
      }
      const newComponentName = componentName.replace(regex, '')
      if (newComponentName === componentName) {
        // No more segments to remove, break the loop.
        break
      }
      componentName = newComponentName
    }

    // If not found, try with resolveComponent. This provides a warning if the component is not found.
    return typeof resolveComponent(element) === 'object' ? resolveComponent(element) : null
  }

  /**
   * Converts custom element data to VNodes for use in slots and render functions.
   *
   * This is the main rendering function that contains all the logic for converting
   * Drupal JSON data to Vue VNodes. It always returns VNode or VNode[] which are
   * the proper return types for slots and render functions.
   *
   * Handles both explicit format {element, props, slots} and legacy format {element, ...props}.
   *
   * @param customElements {CustomElementContent} - Custom element data to render.
   * @returns VNode | VNode[] | null
   *          - VNode: For single elements and strings
   *          - VNode[]: For arrays
   *          - null: For empty/null input
   *
   * Usage:
   * - In slot functions: return renderCustomElementsToVNodes(slotData)
   * - In render functions: return renderCustomElementsToVNodes(data)
   */
  const renderCustomElementsToVNodes = (
    customElements: CustomElementContent,
  ): VNode | VNode[] | null => {
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

    // Handle multiple elements - return VNode[]
    if (Array.isArray(customElements)) {
      return customElements.map(element => renderCustomElementsToVNodes(element))
    }

    // Handle single custom element object based on configured format
    if (config.customElementJsonFormat === 'explicit') {
      // Verify format is explicit: check for keys that are NOT element/props/slots
      const keys = Object.keys(customElements)
      const hasInvalidKeys = keys.some(key => key !== 'element' && key !== 'props' && key !== 'slots')

      if (hasInvalidKeys) {
        // Format doesn't match expectation - warn and fall back to legacy
        if (import.meta.dev) {
          console.warn('[nuxtjs-drupal-ce] Legacy format detected but explicit format expected. Auto-switching to legacy. Consider configuring customElementJsonFormat: "legacy" if your API uses the legacy format.')
        }
        // Use legacy format handling
        const { element, ...props } = customElements
        const resolvedElement = resolveCustomElement(element)
        return resolvedElement ? h(resolvedElement, props) : null
      }

      // Use explicit format: {element, props?, slots?}
      const explicitElement = customElements as CustomElementExplicitContent
      const { element, props = {}, slots = {} } = explicitElement
      const resolvedElement = resolveCustomElement(element)

      if (!resolvedElement) {
        return null
      }

      // Render slots recursively
      const slotFunctions: Record<string, () => any> = {}
      Object.entries(slots).forEach(([slotName, slotContent]) => {
        slotFunctions[slotName] = () => renderCustomElementsToVNodes(slotContent as CustomElementContent)
      })

      return h(resolvedElement, props, slotFunctions)
    }
    else {
      // Config is 'legacy' - use legacy format handling
      const { element, ...props } = customElements
      const resolvedElement = resolveCustomElement(element)
      return resolvedElement ? h(resolvedElement, props) : null
    }
  }

  /**
   * Renders Vue components from JSON-serialized custom element data.
   *
   * Wrapper around renderCustomElementsToVNodes that makes the result compatible with
   * <component :is> by wrapping VNode[] in a Component.
   *
   * @param customElements {CustomElementContent} - Custom element data to render.
   *          See {@link https://github.com/drunomics/nuxtjs-drupal-ce/blob/2.x/src/types.d.ts} type definition for detailed structure documentation.
   * @returns VNode | Component | null
   *          - VNode: For single elements and strings
   *          - Component: For arrays (wraps VNode[] in defineComponent for <component :is> compatibility)
   *          - null: For empty/null input
   *
   * Usage:
   * - In templates: <component :is="renderCustomElements(data)" />
   * - For slots/render functions: Use renderCustomElementsToVNodes() instead
   */
  const renderCustomElements = (
    customElements: CustomElementContent,
  ): VNode | Component | null => {
    const vnodes = renderCustomElementsToVNodes(customElements)

    // If we got an array of VNodes, wrap in a Component for <component :is> compatibility
    if (Array.isArray(vnodes)) {
      return defineComponent({
        setup() {
          return () => vnodes
        }
      })
    }

    // Single VNode or null - return as-is
    return vnodes
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
        innerHTML: JSON.stringify(page.value.metatags.jsonld || [], null, ''),
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
    renderCustomElementsToVNodes,
    resolveCustomElement,
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

const pageErrorHandler = (error: Record<string, any>, _context?: Record<string, any>) => {
  const errorData = error.value.data

  // Make sure the error is logged to console also.
  console.error('[nuxtjs-drupal-ce] Page fetch error:', {
    statusCode: error.value.statusCode,
    statusMessage: error.value.message,
    ...(import.meta.dev && {
      data: errorData,
      cause: error.value.cause,
      stack: error.value.stack,
    })
  })

  // At the moment, Nuxt API proxy does not provide a nice error when the backend is not reachable. Handle it better.
  // See https://github.com/nuxt/nuxt/issues/22645
  if (error.value.statusCode === 500 && errorData?.message === 'fetch failed' && !errorData.statusMessage) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Unable to reach backend.',
      data: import.meta.dev ? errorData : undefined,
      cause: import.meta.dev ? error.value.cause : undefined,
      fatal: true,
    })
  }
  throw createError({
    statusCode: error.value.statusCode,
    statusMessage: error.value?.message,
    data: import.meta.dev ? error.value.data : undefined,
    cause: import.meta.dev ? error.value.cause : undefined,
    fatal: true,
  })
}
