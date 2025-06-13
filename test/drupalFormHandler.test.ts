import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import DrupalCe from '../'
import { join } from 'node:path'

describe('Drupal form handler', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../playground'),
    nuxtConfig: {
      modules: [
        DrupalCe,
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3012',
        ceApiEndpoint: '/ce-api',
        disableFormHandler: ['/form/custom2'],
      },
    },
    port: 3012,
  })

  it('test with form handler enabled', async () => {
    const page = await createPage('/form/custom')
    const name = page.locator('input[name="name"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)
    expect(await submit.isVisible()).toBe(true)

    await name.fill('admin')
    await submit.click()

    await new Promise(resolve => setTimeout(resolve, 3000))

    expect(await page.content()).toContain('Form response received, submit was successful!')
  })

  it('test with form handler disabled', async () => {
    const page = await createPage('/form/custom2')
    const name = page.locator('input[name="name"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)
    expect(await submit.isVisible()).toBe(true)

    await name.fill('admin')
    await submit.click()

    await new Promise(resolve => setTimeout(resolve, 3000))

    // Without form handler, the form should not display form response.
    expect(await page.content()).not.toContain('Form response received, submit was successful!')
  })

  it('form handler is bypassed with not matching content-type header', async () => {
    const page = await createPage('/form/custom')
    const name = page.locator('input[name="name"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)
    expect(await submit.isVisible()).toBe(true)

    // Set up request interception to add the header.
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const headers = request.headers();
        headers['content-type'] = 'application/json';
        await route.continue({ headers });
      } else {
        await route.continue();
      }
    });

    await name.fill('admin')
    await submit.click()

    await page.waitForTimeout(3000)

    // With the not matching content-type, the form handler should bypass processing.
    expect(await page.content()).not.toContain('Form response received, submit was successful!')
  })
})
