import { fileURLToPath } from 'node:url'
import { describe, it, expect, afterEach } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils/e2e'

describe('User login form', async () => {
  let page

  afterEach(async () => {
    if (page) {
      await page.context().clearCookies()
      await page.close()
    }
  })
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    configFile: 'nuxt.config4test',
    port: 3001,
    browser: true,
  })

  it('catches wrong credentials message', async () => {
    page = await createPage('/user/login')

    const name = page.locator('input[name="name"]')
    const pwd = page.locator('input[name="pass"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)

    await name.fill('admin')
    await pwd.fill('wrongpwd')

    await submit.click()

    expect(await page.getByText('Unrecognized username or password').isVisible()).toBe(true)
  })

  it('correctly logs-in user', async () => {
    page = await createPage('/user/login')

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
  })
})
