import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { join } from 'node:path'

describe('Component Preview Production Mode', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    configFile: 'nuxt.config4test',
    server: true,
    dev: false,
    port: 3015,
  })

  it('builds successfully with component preview enabled', async () => {
    // Just verify the setup completes and server starts
    // CORS configuration happens at build time and is applied to route rules
    expect(true).toBe(true)
  })
})

