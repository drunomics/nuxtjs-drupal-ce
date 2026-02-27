import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import DrupalCe from '../../'
import { join } from 'node:path'

describe('Drupal form handler disabled via boolean', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    nuxtConfig: {
      modules: [
        DrupalCe,
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3016',
        ceApiEndpoint: '/ce-api',
        disableFormHandler: true,
      },
    },
    port: 3016,
  })

  it('disableFormHandler: true prevents form processing', async () => {
    const page = await createPage('/form/custom')
    const name = page.locator('input[name="name"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)
    expect(await submit.isVisible()).toBe(true)

    await name.fill('admin')
    await submit.click()

    await new Promise(resolve => setTimeout(resolve, 3000))

    // With disableFormHandler: true, the middleware is not registered at all,
    // so the form submission should not be processed.
    expect(await page.content()).not.toContain('Form response received, submit was successful!')
  }, 15000)
})
