import { isSamePath, parseURL, withoutBase } from 'ufo'
import { defineNuxtPlugin, useRuntimeConfig } from '#imports'

/**
 * Aligns the SSR payload path with the URL shown in the browser.
 *
 * A CDN in front of the SSR server typically ignores tracking query
 * parameters (utm_*, gclid, gbraid, ...) in its cache key: the HTML cached
 * for one visitor's URL is served to every visitor of the page, whatever
 * their query string. The Nuxt payload of such a response carries the URL
 * of the request that filled the cache (`payload.path`), which may differ
 * from the URL in the visitor's browser.
 *
 * Nuxt initializes the router from `payload.path` when it differs from the
 * browser URL, and syncs the address bar to it during hydration. With a
 * CDN-shared cache entry that would replace the visitor's query string
 * with the one of the visitor that filled the cache — dropping the
 * visitor's own tracking parameters and exposing foreign ones.
 *
 * Which query parameters the CDN ignores is deliberately unknown to this
 * module, so the payload path cannot be normalized during SSR. Instead,
 * this client plugin runs after the payload is revived
 * (`nuxt:revive-payload:client`, order -30) and before the router is
 * created (`nuxt:router`, order -20): when the rendered path matches the
 * browser URL up to query string, `payload.path` is updated to the browser
 * pathname and query. A rendered path that differs in the path itself (e.g.
 * after a server-side redirect) is left for the router to handle.
 *
 * The page data stored under the SSR payload key is re-keyed to the
 * browser URL independently — see `computePageKey()` in the `useDrupalCe`
 * composable.
 */
export default defineNuxtPlugin({
  name: 'drupal-ce:payload-path',
  order: -25,
  setup(nuxtApp) {
    const renderedPath = nuxtApp.payload.path
    if (!renderedPath) {
      return
    }
    const base = useRuntimeConfig().app.baseURL
    const displayedPath = withoutBase(window.location.pathname, base)
    if (isSamePath(parseURL(renderedPath).pathname, displayedPath)) {
      // The hash is intentionally omitted: it never reaches the server, so it
      // is not part of the rendered path, and `nuxt:router`'s
      // `createCurrentLocation()` unconditionally appends the live
      // `window.location.hash` to whatever `payload.path` holds. Including it
      // here would double the fragment (e.g. `/p#gallery-1#gallery-1`) and
      // break hash-based navigation such as gallery deep links.
      nuxtApp.payload.path = displayedPath + window.location.search
    }
  },
})
