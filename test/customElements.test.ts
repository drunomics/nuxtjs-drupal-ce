import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('Custom elements fallback works', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    configFile: 'nuxt.config4test',
    port: 3001,
  })
  it('missing node element is rendered as node--default', async () => {
    const html = await $fetch('/node/4')
    expect(html).toContain('This node is testing custom elements fallback. node-article-demo --> node--default')
  })
})
