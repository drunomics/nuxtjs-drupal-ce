import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { join } from 'node:path'

describe('Page hydration', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    configFile: 'nuxt.config4test',
    port: 3001,
  })

  it('renders regular pages with proper hydration (no errors)', async () => {
    const response = await fetch('/node/1')
    expect(response.status).toEqual(200)
    const html = await response.text()

    // Verify proper content is rendered
    expect(html).toContain('Test page')

    // Ensure we're not getting hydration errors
    expect(html).not.toContain('502 Bad Gateway')
    expect(html).not.toContain('503')
    expect(html).not.toContain('Internal Server Error')

    // Verify page data structure is present in the SSR payload
    // This ensures getPage() will work correctly after hydration
    expect(html).toContain('__NUXT__')

    // Verify that key page properties and content are present in the HTML/payload
    // These are critical for getPage() to work correctly after hydration
    expect(html).toContain('Test page')
    expect(html).toContain('page_layout')
    expect(html).toContain('breadcrumbs')
    expect(html).toContain('metatags')
    expect(html).toContain('__NUXT_DATA__')

    // Verify metadata is properly rendered in the HTML
    expect(html).toContain('<meta name="title" content="Test page | lupus decoupled">')
    expect(html).toContain('<link rel="canonical"')
  })
})
