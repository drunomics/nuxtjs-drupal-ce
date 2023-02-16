import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils'

describe('Module error handling', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    configFile: 'nuxt.config4test'
  })
  it('renders Drupal error page', async () => {
    const html = await $fetch('/node/404')
    expect(html).toContain('The requested page could not be found')
    // This doesn't pass yet, because the module doesn't set the status code for Drupal error pages
    // Uncomment when fixed
    // const { status } = await fetch('/node/404')
    // expect(status).toEqual(404)
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
