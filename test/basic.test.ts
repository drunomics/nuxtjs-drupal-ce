import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('Module renders pages', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    configFile: 'nuxt.config4test'
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
