import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils/e2e'

describe('Drupal page state follows real Nuxt Suspense commits', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/page-commit', import.meta.url)),
    port: 3041,
    browser: true,
  })

  it('keeps shared data on the outgoing page until the destination commits', async () => {
    const page = await createPage()
    try {
      await page.goto(url('/origin'), { waitUntil: 'hydration' })
      await page.click('a[href="/slow"]')
      await page.waitForFunction(() => typeof window.releaseSlowPage === 'function')
      expect(await page.textContent('#page-title')).toBe('origin')
      expect(await page.textContent('#shared-title')).toBe('origin')
      await page.evaluate(() => window.releaseSlowPage())
      await page.waitForFunction(() => document.querySelector('#shared-title')?.textContent === 'slow')
      expect(await page.textContent('#page-title')).toBe('slow')
      await page.click('a[href="/origin"]')
      await page.waitForFunction(() => document.querySelector('#shared-title')?.textContent === 'origin')
      expect(await page.textContent('#page-title')).toBe('origin')
    }
    finally { await page.close() }
  })

  it('does not commit a superseded Suspense destination', async () => {
    const page = await createPage()
    try {
      await page.goto(url('/origin'), { waitUntil: 'hydration' })
      await page.click('a[href="/slow"]')
      await page.waitForFunction(() => typeof window.releaseSlowPage === 'function')
      await page.click('a[href="/fast"]')
      await page.waitForFunction(() => document.querySelector('#shared-title')?.textContent === 'fast')
      await page.evaluate(async () => {
        window.releaseSlowPage()
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      })
      expect(await page.textContent('#shared-title')).toBe('fast')
      expect(await page.textContent('#page-title')).toBe('fast')
    }
    finally { await page.close() }
  })
})
