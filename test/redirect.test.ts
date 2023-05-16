import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('Module redirects work', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    configFile: 'nuxt.config4test'
  })
  it('redirect to /node/1 works', async () => {
    const html = await $fetch('/redirect')
    expect(html).toContain('Node: Test page')
  })
})
