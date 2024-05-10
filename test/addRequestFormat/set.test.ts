import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import DrupalCe from '../..'

describe('Module addRequestFormat option set to true', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/debug', import.meta.url)),
    nuxtConfig: {
      modules: [
        DrupalCe
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3200',
        ceApiEndpoint: '/api',
        addRequestFormat: true
      }
    },
    port: 3200
  })
  it('is correctly set in query', async () => {
    const html = await $fetch('/')
    expect(html).toContain('_format=custom_elements')
  })
})
