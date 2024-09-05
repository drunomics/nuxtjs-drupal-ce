import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import DrupalCe from '../..'

describe('Non-default custom element', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/debug', import.meta.url)),
    nuxtConfig: {
      modules: [
        DrupalCe,
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3103',
        ceApiEndpoint: '/api',
      },
    },
    port: 3103,
  })
  it('non-default custom element is rendered correctly', async () => {
    const html = await $fetch('/node/4')
    expect(html).toContain('<div class="node node-article-demo"')
    expect(html).toContain('Article demo')
  })
})
