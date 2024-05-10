import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import DrupalCe from '../..'

describe('Module addRequestContentFormat option set to json', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/debug', import.meta.url)),
    nuxtConfig: {
      modules: [
        DrupalCe,
      ],
      drupalCe: {
        drupalBaseUrl: '',
        ceApiEndpoint: '/api',
        addRequestContentFormat: 'json',
        serverApiProxy: false,
      },
    },
  })
  it('is correctly set in query', async () => {
    const html = await $fetch('/')
    expect(html).toContain('_content_format=json')
    expect(html).not.toContain('_content_format=markup')
  })
})
