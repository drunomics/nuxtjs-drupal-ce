// test/e2e/preview-routes.spec.ts
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'

describe('Preview routes', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../../playground', import.meta.url)),
    port: 3001,
    configFile: 'nuxt.config4test.ts',
    browser: true
  })

  describe('node preview route', async () => {
    it('renders content client-side', async () => {
      const page = await createPage('/preview/node')
      await page.waitForLoadState('networkidle')

      const initialHtml = await $fetch('/preview/node')
      expect(initialHtml).not.toContain('Some example body')

      const content = await page.textContent('main')
      expect(content).toContain('Some example body')
    })
  })

  describe('layout-preview route', async () => {
    it('renders content client-side', async () => {
      const page = await createPage('/node/5/layout-preview')
      await page.waitForLoadState('networkidle')

      const initialHtml = await $fetch('/node/5/layout-preview')
      expect(initialHtml).not.toContain('Some example body')

      const content = await page.textContent('main')
      expect(content).toContain('Some example body')
    })
  })
})
