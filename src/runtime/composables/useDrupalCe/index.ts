import { defu } from 'defu'
import { appendResponseHeader } from 'h3'
import type { $Fetch, NitroFetchRequest } from 'nitropack'
import { type Ref, type ComputedRef, type Component, type VNode, Fragment } from 'vue'
import { getDrupalBaseUrl, getMenuBaseUrl, headersToRecord } from './server'
import type { DrupalResolvedLibrary } from './drupalLibraryLoader'
import type { UseFetchOptions, AsyncData } from '#app'
import { callWithNuxt } from '#app'
import { useRuntimeConfig, useState, useFetch, navigateTo, createError, h, resolveComponent, setResponseStatus, useNuxtApp, useRequestHeaders, ref, watch, useRequestEvent, computed, useHead, defineComponent, toRef, useRoute, useRouter, useSlots } from '#imports'
import type { DrupalCePage, DrupalCeApiResponse } from '../../types'

// Cache the dynamic import of the library loader in a single module-level
// promise. All loadLibrary() callers await the *same* promise, so their
// continuations run in strict call order — which keeps libraries enqueued in
// dependency order even when several <drupal-library-*> elements call it in the
// same tick. (Per-call `import()` can resolve out of order under Vite dev.)
let drupalLibraryLoaderPromise: Promise<typeof import('./drupalLibraryLoader')> | undefined

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
    // Pass through Drupal response headers (e.g. cache-control, set-cookie)
    // to the SSR response, so the browser sees them. This handles the normal
    // page-fetch path; form POST responses go through drupalFormHandler
    // middleware instead and are passed through in useDrupalCePage below.
    fetchOptions.onResponse = (context) => {
      if (doPassThroughHeaders && import.meta.server && privateConfig?.passThroughHeaders) {
        passThroughHeaders(nuxtApp, headersToRecord(context.response.headers))
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
   * Helper to compute page cache key
   *
   * Uses different strategies based on rendering mode:
   *
   * **Prerendering (SSG):**
   * Uses route path as cache key (e.g., `page-/node/1-direct`). This is safe because
   * static files can't vary by query parameters - the same HTML file is served regardless
   * of URL query params. Each prerendered page gets its own unique cache key, using the
   * same key format as the client-side for consistency.
   *
   * **Server-Side Rendering (SSR):**
   * Uses a special '__ssr__' cache key to handle CDN query parameter filtering.
   * CDNs typically strip tracking parameters (utm_*, fbclid, etc.) from their cache keys:
   *
   * 1. CDN caches: /blog?page=1 (strips utm_source=newsletter)
   * 2. User visits: /blog?page=1&utm_source=newsletter
   * 3. CDN serves cached HTML from step 1
   * 4. Client sees full URL with utm_source in browser
   *
   * Without the __ssr__ key, this would cause:
   * - SSR: Cache key for /blog?page=1
   * - Client: Cache key for /blog?page=1&utm_source=newsletter
   * - Different keys → re-fetch during hydration → DOM manipulation → errors
   *
   * The __ssr__ key solves this by:
   * - SSR always uses '__ssr__' key (only one page rendered per request)
   * - Client moves __ssr__ cache to proper key on first access
   * - After move, all subsequent calls use normal keys
   *
   * @param skipProxy Whether proxy is being skipped
   * @param nuxtApp Nuxt app instance (needed to move __ssr__ cache on client)
   */
  const computePageKey = (skipProxy: boolean, nuxtApp: any): string => {
    // Helper to build the standard cache key from a path
    const buildKey = (path: string) => {
      const sanitized = path.replace(/\/(\?|$)/, '$1')
      const proxyMode = skipProxy ? '-direct' : '-proxy'
      return `page-${sanitized}${proxyMode}`
    }

    // During prerendering (SSG), use route-based keys to prevent data sharing between pages.
    // Each prerendered page gets its own unique key. Static files can't vary by query params,
    // so using route.path (without query) is correct and matches what the client will compute.
    // @ts-expect-error import.meta.prerender is available in Nuxt 3.8+
    if (import.meta.prerender) {
      const route = useRoute()
      return buildKey(route.path)
    }

    // During SSR (not prerendering), use the special __ssr__ key.
    // This handles CDN query parameter filtering where CDNs strip tracking params.
    if (import.meta.server) {
      return '__ssr__'
    }

    // On client-side, calculate the proper cache key with full path and query parameters.
    // During hydration, use nuxtApp's router which is always available.
    const route = nuxtApp.$router?.currentRoute?.value || useRoute()
    const pathWithQuery = route.fullPath.split('#')[0]
    const properKey = buildKey(pathWithQuery)

    // During initial hydration, if __ssr__ cache exists, move it to the proper key
    // This ensures the SSR data is available under the correct key for this URL
    if (nuxtApp.payload.data['__ssr__']) {
      nuxtApp.payload.data[properKey] = nuxtApp.payload.data['__ssr__']
      delete nuxtApp.payload.data['__ssr__']
    }

    return properKey
  }

  /**
   * Fetches page data from Drupal, handles redirects, errors and messages
   *
   * By default, the cache key is generated from the current route's fullPath (without hash).
   * This can be customized by providing useFetchOptions.key.
   *
   * @param path Path of the Drupal page to fetch
   * @param useFetchOptions Optional Nuxt useFetch options. Can include custom cache key via 'key' property.
   * @param overrideErrorHandler Optional error handler
   * @param skipDrupalCeApiProxy Force skip the Drupal CE API proxy. Defaults to false.
   *                             The proxy might still be skipped if serverApiProxy is set to false globally.
   */
  const fetchPage = async (path: string, useFetchOptions: UseFetchOptions<any> = {}, overrideErrorHandler?: (error?: any) => void, skipDrupalCeApiProxy: boolean = false): Promise<Ref<DrupalCePage>> => {
    const nuxtApp = useNuxtApp()
    const currentPageKey = useState<string>('drupal-ce-current-page-key')

    // Build cache key from current route's fullPath (without hash) if not already provided
    // Callers can optionally provide a custom key via useFetchOptions.key
    const skipProxy = !(config.serverApiProxy && !skipDrupalCeApiProxy)
    if (!useFetchOptions.key) {
      useFetchOptions.key = computePageKey(skipProxy, nuxtApp)
    }

    // Two paths for page data:
    // 1. Form POST: drupalFormHandler middleware already fetched the response
    //    from Drupal and stored it in event.context.drupalCeCustomPageResponse.
    //    We use that data directly (no second fetch) and pass through its
    //    headers here — this is how session cookies reach the browser on login.
    // 2. Normal GET: we fetch from the CE API via useCeApi; headers are passed
    //    through in its onResponse callback above.
    const customPageResponse = import.meta.server
      ? useRequestEvent(nuxtApp).context.drupalCeCustomPageResponse
      : null

    let pageRef: Ref<DrupalCePage>
    let error: any

    if (customPageResponse) {
      pageRef = toRef(nuxtApp.payload.data, useFetchOptions.key)
      pageRef.value = customPageResponse._data
      error = customPageResponse.error

      if (customPageResponse._data) {
        passThroughHeaders(nuxtApp, customPageResponse.headers)
      }
    }
    else {
      const result = await useCeApi(path, useFetchOptions, true, skipDrupalCeApiProxy)
      pageRef = result.data
      error = result.error.value
    }

    // Process messages
    if (pageRef.value?.messages) {
      pushMessagesToState(pageRef.value.messages)
    }

    // Handle redirect
    if (pageRef.value?.redirect) {
      await callWithNuxt(nuxtApp, navigateTo, [
        pageRef.value.redirect.url,
        { external: pageRef.value.redirect.external, redirectCode: pageRef.value.redirect.statusCode, replace: true },
      ])
      pageRef.value = createEmptyPage()
    }
    // Handle error
    else if (error) {
      const errorData = error.data

      // Validate that error response has complete page structure
      // Backend MUST return a complete page structure for custom error pages
      const isValidPageStructure = errorData &&
        typeof errorData.title === 'string' &&
        typeof errorData.content === 'object' &&
        typeof errorData.metatags === 'object'

      // When customErrorPages is enabled, always throw to let custom error handler process it
      // Otherwise, only throw if backend didn't return a complete error page
      if (!isValidPageStructure || config.customErrorPages) {
        // Fatal error or custom error pages enabled - delegate to error handler
        (overrideErrorHandler || pageErrorHandler)({ value: error }, { config, nuxtApp })
        pageRef.value = createEmptyPage()
      }
      else {
        // Backend returned a complete custom error page and customErrorPages is disabled
        // For error responses, useFetch doesn't cache data properly in the payload
        // We need to manually link pageRef to the cache and copy error.data so it persists through SSR hydration
        pageRef = toRef(nuxtApp.payload.data, useFetchOptions.key as string)
        pageRef.value = errorData

        if (import.meta.server) {
          callWithNuxt(nuxtApp, setResponseStatus, [error.statusCode])
        }
      }
    }
    // Handle missing page
    else if (!pageRef.value) {
      pageRef.value = createEmptyPage()
    }

    // Add key to page
    pageRef.value.key = useFetchOptions.key

    // Store the current page key for getPage() lookup
    currentPageKey.value = useFetchOptions.key

    return pageRef
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
   *
   * By default, the cache key is generated from the current route's fullPath (without hash).
   * This can be customized by providing a custom key.
   *
   * @param customKey Optional custom cache key. If not provided, uses current route's cache key.
   */
  const getPage = (customKey?: string): Ref<DrupalCePage> => {
    const nuxtApp = useNuxtApp()
    const currentPageKey = useState<string>('drupal-ce-current-page-key', () => '')

    // Set up route watcher to keep currentPageKey in sync (for KeepAlive scenarios)
    // Only needed when using default key (not custom key)
    if (!customKey && import.meta.client) {
      const watcherInitialized = useState<boolean>('drupal-ce-watcher-init', () => false)
      const pendingPageKey = useState<string>('drupal-ce-pending-page-key', () => '')

      if (!watcherInitialized.value) {
        watcherInitialized.value = true
        try {
          const router = useRouter()

          // Determine proxy mode based on config (same logic as fetchPage)
          const skipProxy = !config.serverApiProxy

          // Track the initial key without switching current until data exists
          pendingPageKey.value = computePageKey(skipProxy, nuxtApp)

          // Use router.afterEach to update the pending key after navigation completes
          router.afterEach(() => {
            pendingPageKey.value = computePageKey(skipProxy, nuxtApp)
          })

          // Promote pending key to current key once payload data is present
          watch(
            () => pendingPageKey.value && nuxtApp.payload.data[pendingPageKey.value],
            (page) => {
              if (page && pendingPageKey.value) {
                currentPageKey.value = pendingPageKey.value
              }
            },
            { immediate: true },
          )
        }
        catch {
          // Silently skip if not in proper Nuxt context (e.g., unit tests)
        }
      }
    }

    // Return computed ref that looks up the page data in the reactive Nuxt payload
    // Uses custom key if provided, otherwise uses current route's key
    return computed(() => {
      const key = customKey || currentPageKey.value
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
   * Pass through allow-listed headers from a Drupal response to the SSR
   * response.
   *
   * @param nuxtApp The Nuxt app instance
   * @param pageHeaders The headers from the Drupal response, as a plain
   *   record. Multi-value headers (e.g. multiple Set-Cookie values) must
   *   arrive as an array - use headersToRecord() from ./server when
   *   converting from a Headers object.
   */
  const passThroughHeaders = (nuxtApp, pageHeaders: Record<string, string | string[]> | undefined) => {
    if (!nuxtApp.ssrContext) {
      return
    }
    const event = nuxtApp.ssrContext.event
    if (pageHeaders) {
      Object.keys(pageHeaders).forEach((key) => {
        if (!privateConfig?.passThroughHeaders.includes(key)) return
        const value = pageHeaders[key]
        // Multi-value headers must be appended once per value - h3's
        // appendResponseHeader comma-joins arrays.
        if (Array.isArray(value)) {
          for (const v of value) {
            appendResponseHeader(event, key, v)
          }
        }
        else {
          appendResponseHeader(event, key, value)
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

  /**
   * Extracts individual VNodes from a named slot, unwrapping any Fragment
   * wrappers that Vue adds during template-based slot forwarding.
   *
   * This allows components to work with slot content as a flat array of items,
   * which is needed when the component controls rendering (e.g. carousel items,
   * load-more lists).
   */
  const getSlotItems = (slotName: string): ComputedRef<VNode[]> => {
    const slots = useSlots()
    return computed(() => {
      const vnodes = slots[slotName]?.() ?? []
      return vnodes.flatMap(vnode =>
        vnode.type === Fragment ? (vnode.children as VNode[]) : [vnode]
      )
    })
  }

  /**
   * Lazily loads a resolved Drupal JS library in the browser and runs its
   * behaviours.
   *
   * The heavy loader (script queue, drupalSettings seeding, attachBehaviors)
   * lives in a separate module and is dynamically imported here, so it — and
   * the Drupal JS it pulls in — is only fetched the first time loadLibrary() is
   * called. The library is already resolved by the backend, which emits its JS
   * files (in dependency order) and merged drupalSettings on the corresponding
   * <drupal-library-*> custom element; this just loads them.
   *
   * @param library The resolved library ({ js, drupalSettings }) from the
   *   backend-generated <drupal-library-*> element.
   * @returns Promise settling once the library's JS has loaded (client-side);
   *   resolves immediately on the server.
   */
  const loadLibrary = async (library: DrupalResolvedLibrary): Promise<void> => {
    if (import.meta.server) {
      return
    }
    const { loadDrupalLibrary } = await (drupalLibraryLoaderPromise ??= import('./drupalLibraryLoader'))
    await loadDrupalLibrary(library, getDrupalBaseUrl())
  }

  return {
    $ceApi,
    useCeApi,
    loadLibrary,
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
    getSlotItems,
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
