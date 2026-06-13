import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { setup, fetch, url, createPage } from '@nuxt/test-utils/e2e'

/**
 * A CDN in front of the SSR server typically ignores tracking query
 * parameters (utm_*, gclid, gbraid, ...) in its cache key: the HTML cached
 * for one visitor's URL is served to every visitor of the page, whatever
 * their query string. The Nuxt payload of such a response carries the URL
 * of the request that filled the cache (payload.path), which differs from
 * the URL in the visitor's browser. The visitor's URL must survive
 * hydration (no foreign query string replaced into the address bar) and
 * the page must hydrate from the SSR payload without a client-side
 * re-fetch.
 */
describe('Hydration with a CDN-shared cache entry', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    configFile: 'nuxt.config4test',
    port: 3001,
    browser: true,
  })

  /**
   * Serves the given HTML for any document request to `requestPath`,
   * regardless of its query string — exactly what a CDN with a shared cache
   * entry does. Returns a counter of client-side page-data requests, which
   * must stay empty when the page hydrates from the embedded SSR payload.
   */
  const createPageWithCachedResponse = async (cachedHtml: string, requestPath = '/node/1') => {
    const page = await createPage()
    const pageDataRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/drupal-ce/node/')) {
        pageDataRequests.push(request.url())
      }
    })
    await page.route(`**${requestPath}*`, (route) => {
      if (route.request().resourceType() === 'document') {
        return route.fulfill({ body: cachedHtml, contentType: 'text/html' })
      }
      return route.continue()
    })
    return { page, pageDataRequests }
  }

  it('keeps the visitor URL when the payload was rendered for a different query string', { timeout: 30000 }, async () => {
    // Fill the "CDN cache": render the page for a foreign ad-click URL.
    const cachedResponse = await fetch('/node/1?gclid=foreign-click-id&gad_source=1')
    const cachedHtml = await cachedResponse.text()
    expect(cachedHtml).toContain('__NUXT_DATA__')

    const { page, pageDataRequests } = await createPageWithCachedResponse(cachedHtml)
    const visitorUrl = url('/node/1?utm_source=newsletter&gclid=visitor-click-id')
    await page.goto(visitorUrl, { waitUntil: 'hydration' })

    // The visitor's own URL must survive hydration — the foreign URL from
    // the payload must not be replaced into the address bar.
    expect(page.url()).toBe(visitorUrl)

    // The page must have hydrated from the SSR payload.
    expect(await page.evaluate(() => document.body.textContent)).toContain('Test page')
    expect(pageDataRequests).toEqual([])

    await page.close()
  })

  it('keeps the visitor URL when the payload was rendered without any query string', { timeout: 30000 }, async () => {
    const cachedResponse = await fetch('/node/1')
    const cachedHtml = await cachedResponse.text()

    const { page, pageDataRequests } = await createPageWithCachedResponse(cachedHtml)
    const visitorUrl = url('/node/1?gbraid=visitor-click-id&gad_source=1')
    await page.goto(visitorUrl, { waitUntil: 'hydration' })

    expect(page.url()).toBe(visitorUrl)
    expect(await page.evaluate(() => document.body.textContent)).toContain('Test page')
    expect(pageDataRequests).toEqual([])

    await page.close()
  })

  /**
   * The reverse guard: when the rendered path differs from the browser URL
   * in the *pathname* (not just the query string), it is a genuine
   * server-side redirect — `payload.path` is the redirect target and must
   * NOT be aligned to the browser URL. Nuxt's router then navigates the
   * address bar to that target. If the plugin ever clobbered `payload.path`
   * in this case, the redirect would be silently lost.
   */
  it('follows the redirect target when the rendered path differs in the pathname', { timeout: 30000 }, async () => {
    // The redirect target render: payload.path is /node/3 ("Another page").
    const targetResponse = await fetch('/node/3')
    const targetHtml = await targetResponse.text()
    expect(targetHtml).toContain('__NUXT_DATA__')

    // The CDN serves that HTML for a request to the pre-redirect URL /node/1.
    const { page, pageDataRequests } = await createPageWithCachedResponse(targetHtml, '/node/1')
    await page.goto(url('/node/1'), { waitUntil: 'hydration' })

    // The router must follow payload.path to the redirect target /node/3 —
    // the plugin must leave it untouched, never rewrite it to /node/1.
    expect(page.url()).toBe(url('/node/3'))
    expect(await page.evaluate(() => document.body.textContent)).toContain('Another page')
    expect(pageDataRequests).toEqual([])

    await page.close()
  })
})
