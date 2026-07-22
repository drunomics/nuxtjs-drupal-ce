import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, url, createPage } from '@nuxt/test-utils/e2e'
import { join } from 'node:path'

describe('Module redirects work', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    configFile: 'nuxt.config4test',
    port: 3001,
    browser: true,
  })

  it('redirect to /node/1 works', async () => {
    const html = await $fetch('/redirect')
    await new Promise(resolve => setTimeout(resolve, 3000))
    expect(html).toContain('Node: Test page')
  })

  /**
   * A CE-API redirect payload arriving during SPA (client-side) navigation
   * must re-target the visible route: the URL must end up on the redirect
   * target and the target page must mount.
   *
   * The repeat visit is the critical case: the payload cache entry for the
   * redirect source must retain the redirect payload, so the redirect is
   * followed again when fetchPage() serves the path from the cache. If
   * fetchPage() overwrites the entry (e.g. with an empty page), repeat
   * visits strand on the source URL with the previous page visible.
   */
  it('redirect is followed on SPA navigation, including repeat visits', { timeout: 60000 }, async () => {
    const page = await createPage()
    await page.goto(url('/node/1'), { waitUntil: 'hydration' })
    expect(await page.evaluate(() => document.body.textContent)).toContain('Test page')

    // First SPA visit: CE-API answers /redirect-to-3 with a redirect
    // payload to /node/3 (async fetch).
    await page.click('a[href="/redirect-to-3"]')
    await page.waitForURL('**/node/3', { timeout: 10000 })
    expect(page.url()).toBe(url('/node/3'))
    expect(await page.evaluate(() => document.body.textContent)).toContain('Another page')

    // Navigate back to the start page (/node/3 uses the bare "clear"
    // layout without the main menu, so use history navigation).
    await page.goBack()
    await page.waitForURL('**/node/1', { timeout: 10000 })
    expect(await page.evaluate(() => document.body.textContent)).toContain('Test page')

    // Second SPA visit: the redirect payload is served from the client-side
    // cache (synchronous resolution) — the redirect must still be followed.
    await page.click('a[href="/redirect-to-3"]')
    await page.waitForURL('**/node/3', { timeout: 10000 })
    expect(page.url()).toBe(url('/node/3'))
    expect(await page.evaluate(() => document.body.textContent)).toContain('Another page')

    await page.close()
  })
})
