import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import DrupalCe from '../../'

describe('Drupal Form Handler enabled', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../../playground', import.meta.url)),
    nuxtConfig: {
      modules: [
        DrupalCe,
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3103',
        ceApiEndpoint: '/ce-api',
      },
    },
    port: 3103,
  })

  it('successfully processes login form submission', async () => {
    const page = await createPage('/user/login')
  
    const name = page.locator('input[name="name"]')
    const pwd = page.locator('input[name="pass"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)

    await name.fill('admin')
    await pwd.fill('drupal123')
    await submit.click()
    
    // Wait for the successful redirect which indicates the form response was processed.
    await page.waitForURL('**/node/1', { timeout: 10000 })
  })
  
  it('middleware skips processing due to wrong content type', async () => {
    const page = await createPage('/user/login')

    // Set the content type to application/json to make middleware skip processing.
    await page.setExtraHTTPHeaders({
      'Content-Type': 'application/json',
    })

    const name = page.locator('input[name="name"]')
    const pwd = page.locator('input[name="pass"]')
    const submit = page.locator('input[type="submit"]')
    expect(await name.isVisible()).toBe(true)

    await name.fill('admin')
    await pwd.fill('drupal123')
    await submit.click()

    try {
      await page.waitForURL('**/node/1', { timeout: 3000 })
      // If we reach here, the test should fail because the redirect shouldn't happen.
      expect(false).toBe(true)
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (_) {
      expect(page.url()).toContain('/user/login')
    }
  })
})