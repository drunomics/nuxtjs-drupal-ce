import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import DrupalCe from '../../..'
import { join } from 'node:path'

describe('Module addRequestContentFormat set to markup', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../fixtures/debug'),
    nuxtConfig: {
      modules: [
        DrupalCe,
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3101',
        ceApiEndpoint: '/ce-api',
        addRequestContentFormat: 'markup',
      },
    },
    port: 3101,
  })
  it('is correctly set in query', async () => {
    const html = await $fetch('/')
    expect(html).toContain('_content_format=markup')
    expect(html).not.toContain('_content_format=json')
  })
})
