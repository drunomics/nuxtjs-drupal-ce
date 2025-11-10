import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { join } from 'node:path'

describe('Module error handling', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    configFile: 'nuxt.config4test',
    port: 3001,
  })
  it('renders Drupal error page', async () => {
    const response = await fetch('/node/404')
    expect(response.status).toEqual(404)
    // HTML returned from SSR page to contain
    // (same as what $fetch returns, but can't use $fetch because the promise rejects)
    expect(await response.text()).toContain('The requested page could not be found')
  })
  it('renders Drupal error page with proper hydration (no 502/503 errors)', async () => {
    const response = await fetch('/node/404')
    expect(response.status).toEqual(404)
    const html = await response.text()

    // The hydration issue causes error pages to show "502 Bad Gateway" or "503"
    // instead of the actual error page content
    // This test verifies the fix is working by ensuring proper content is rendered
    expect(html).toContain('The requested page could not be found')

    // Ensure we're not getting the hydration error page
    expect(html).not.toContain('502 Bad Gateway')
    expect(html).not.toContain('503')
    expect(html).not.toContain('Internal Server Error')

    // Verify page_layout and breadcrumbs are accessible (key parts of the hydration fix)
    // These would fail to render if the page data wasn't properly cached during SSR
    expect(html).toContain('Page not found')
  })
  it('handles 500 statusCode', async () => {
    const response = await fetch('/error500')
    expect(response.status).toEqual(500)
  })
  it('handles 404 statusCode', async () => {
    const { status } = await fetch('/error404')
    expect(status).toEqual(404)
  })
})
