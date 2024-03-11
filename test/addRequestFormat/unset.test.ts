import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import DrupalCe from '../..'

describe('Module addRequestFormat not set', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/debug', import.meta.url)),
    nuxtConfig: {
      modules: [
        DrupalCe
      ],
      drupalCe: {
        baseURL: '/api',
        serverApiProxy: false
      }
    }
  })
  it('is correctly missing in query', async () => {
    const html = await $fetch('/')
    expect(html).not.toContain('_format=custom_elements')
  })
})
