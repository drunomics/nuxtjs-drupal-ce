import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import { join } from 'node:path'

describe('Module redirects work', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../playground'),
    configFile: 'nuxt.config4test',
    port: 3001,
  })
  it('redirect to /node/1 works', async () => {
    const html = await $fetch('/redirect')
    expect(html).toContain('Node: Test page')
  })
})
