import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import DrupalCe from '../'

describe('User login form', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    nuxtConfig: {
      modules: [
        DrupalCe,
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3011',
        ceApiEndpoint: '/ce-api',
      },
    },
    port: 3011,
  })

  it('catches wrong credentials message', async () => {
    const page = await createPage('/user/login')

    const name = page.locator('input[name="name"]')
    const pwd = page.locator('input[name="pass"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)

    await name.fill('admin')
    await pwd.fill('wrongpwd')

    await submit.click()

    await page.waitForSelector('text=Unrecognized username or password', { timeout: 5000 })
    expect(await page.getByText('Unrecognized username or password').isVisible()).toBe(true)
  })

  it('correctly logs-in user', async () => {
    const page = await createPage('/user/login')

    const name = page.locator('input[name="name"]')
    const pwd = page.locator('input[name="pass"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)

    await name.fill('admin')
    await pwd.fill('drupal123')

    await submit.click()
    // Wait for login success redirect
    await page.waitForURL('**/node/1')

    // Check for session cookie
    const cookies = await page.context().cookies()
    expect(cookies.some(cookie => cookie.name === 'SSESSf9f2dc90f4drupal')).toBe(true)
    // Cleanup
    await page.context().clearCookies()
  })
})
