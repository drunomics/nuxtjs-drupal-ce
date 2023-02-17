import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import DrupalCe from '../..'

describe('Module addRequestContentFormat option set to json', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/debug', import.meta.url)),
    nuxtConfig: {
      modules: [
        DrupalCe
      ],
      drupalCe: {
        baseURL: '/api',
        addRequestContentFormat: 'json'
      }
    }
  })
  it('is correctly set in query', async () => {
    const html = await $fetch('/')
    expect(html).toContain('addRequestContentFormat=json')
    expect(html).not.toContain('addRequestContentFormat=markup')
  })
})
