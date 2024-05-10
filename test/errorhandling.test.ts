import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils'

describe('Module error handling', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
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
  it('handles 500 statusCode', async () => {
    const response = await fetch('/error500')
    expect(response.status).toEqual(500)
  })
  it('handles 404 statusCode', async () => {
    const { status } = await fetch('/error404')
    expect(status).toEqual(404)
  })
})
