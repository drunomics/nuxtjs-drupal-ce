import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { join } from 'node:path'

const retryableSocketErrors = new Set(['ECONNREFUSED', 'UND_ERR_SOCKET'])

function isRetryableFetchError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const maybeError = error as { code?: string, cause?: unknown }
  if (typeof maybeError.code === 'string' && retryableSocketErrors.has(maybeError.code)) return true
  if (!maybeError.cause || typeof maybeError.cause !== 'object') return false
  const cause = maybeError.cause as { code?: string, cause?: unknown }
  if (typeof cause.code === 'string' && retryableSocketErrors.has(cause.code)) return true
  if (!cause.cause || typeof cause.cause !== 'object') return false
  const nestedCause = cause.cause as { code?: string }
  return typeof nestedCause.code === 'string' && retryableSocketErrors.has(nestedCause.code)
}

async function fetchWithRetry(url: string, attempts = 4, delayMs = 350) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url)
    }
    catch (error) {
      if (!isRetryableFetchError(error) || attempt === attempts) throw error
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  throw new Error(`Failed to fetch ${url} after ${attempts} attempts`)
}

async function fetchExpectStatus(url: string, expectedStatus: number, attempts = 5, delayMs = 350) {
  let lastResponse: Awaited<ReturnType<typeof fetch>> | undefined

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetchWithRetry(url, 3, delayMs)
    lastResponse = response

    if (response.status === expectedStatus) {
      return response
    }

    // During app startup in CI, Drupal proxy can briefly return gateway errors.
    if ((response.status === 502 || response.status === 503) && attempt < attempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      continue
    }

    return response
  }

  return lastResponse as Awaited<ReturnType<typeof fetch>>
}

describe('Module error handling', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    configFile: 'nuxt.config4test',
    port: 3001,
  })
  it('renders Drupal error page', async () => {
    const response = await fetchWithRetry('/node/404')
    expect(response.status).toEqual(404)
    // HTML returned from SSR page to contain
    // (same as what $fetch returns, but can't use $fetch because the promise rejects)
    expect(await response.text()).toContain('The requested page could not be found')
  })
  it('renders Drupal error page with proper hydration (no 502/503 errors)', async () => {
    const response = await fetchWithRetry('/node/404')
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
  it('handles 404 statusCode', async () => {
    const { status } = await fetchExpectStatus('/error404', 404)
    expect(status).toEqual(404)
  })
  it('handles 500 statusCode', async () => {
    const response = await fetchExpectStatus('/error500', 500)
    expect(response.status).toEqual(500)
  })
})
