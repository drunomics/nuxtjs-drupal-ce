import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import DrupalCe from '../../'
import { join } from 'node:path'

describe('Site works with serverApiProxy disabled', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    nuxtConfig: {
      modules: [
        DrupalCe,
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3002',
        ceApiEndpoint: '/ce-api',
        serverApiProxy: false,
      },
    },
    port: 3002,
  })
  it('renders homepage', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Welcome to your custom-elements enabled Drupal site')
  })
  it('renders menu', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Another page')
    expect(html).toContain('Test page')
  })
  it('renders test page', async () => {
    const html = await $fetch('/node/1')
    expect(html).toContain('Node: Test page')
  })
})
