import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { join } from 'node:path'

describe('Component Preview Integration', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    configFile: 'nuxt.config4test',
    port: 3002,
  })

  it('loads nuxt-component-preview module', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Welcome')
  })
})
