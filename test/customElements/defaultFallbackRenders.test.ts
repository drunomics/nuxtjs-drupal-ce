import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('Missing custom element with default fallback', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../../playground', import.meta.url)),
    configFile: 'nuxt.config4test',
    port: 3001,
  })
  it('fallback is rendered correctly', async () => {
    const html = await $fetch('/node/4')
    expect(html).toContain('<div class="node node--default"')
    expect(html).toContain('This node is testing custom elements fallback. node-article-demo --> node--default')
  })
})
