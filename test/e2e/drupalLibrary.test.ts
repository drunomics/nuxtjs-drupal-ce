import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import DrupalCe from '../../'

describe('Drupal library loading', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    nuxtConfig: {
      modules: [
        DrupalCe,
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3013',
        ceApiEndpoint: '/ce-api',
      },
    },
    port: 3013,
  })

  it('loads the libraries of a form in dependency order and attaches behaviors', async () => {
    const page = await createPage('/form/states')

    // The <drupal-library-*> elements render nothing themselves.
    expect(await page.locator('drupal-library-core-drupal').count()).toBe(0)

    await page.waitForFunction(() => Boolean((window as any).Drupal?.behaviors?.states))

    // Scripts are injected in the order the backend resolved them.
    const scripts = await page.evaluate(() =>
      [...document.querySelectorAll('script[data-drupal-library]')].map(el => new URL((el as HTMLScriptElement).src).pathname))
    expect(scripts).toEqual(['/core/misc/drupal.js', '/core/misc/states.js'])

    // drupalSettings of the first library element is merged into the global.
    expect(await page.evaluate(() => (window as any).drupalSettings?.states_demo?.greeting)).toBe('Hello from drupalSettings')

    // The behavior attached to the server-rendered markup: the conditional
    // field is hidden until the checkbox is ticked.
    const message = page.locator('[data-drupal-selector="edit-message"]')
    await expect.poll(() => message.isHidden()).toBe(true)

    await page.locator('input[name="show_message"]').check()
    expect(await message.isVisible()).toBe(true)
  }, 20000)
})
