import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('Custom layouts work', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    configFile: 'nuxt.config4test',
    port: 3001
  })
  it('renders a page with a custom layout', async () => {
    const html = await $fetch('/node/3')
    expect(html).toContain('id="main-clear"')
  })
})
