import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { join } from 'node:path'

describe('Component Preview Production Mode', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    configFile: 'nuxt.config4test',
    server: true,
    dev: false,
    port: 3015,
  })

  it('generates component index in production', async () => {
    const json = await $fetch('/nuxt-component-preview/component-index.json')
    expect(json).toBeDefined()
    expect(json.components).toBeDefined()
    expect(Array.isArray(json.components)).toBe(true)
  })

  it('excludes drupal-* components by default', async () => {
    const json = await $fetch('/nuxt-component-preview/component-index.json')
    const drupalComponents = json.components.filter((c: any) => c.id.startsWith('Drupal'))
    expect(drupalComponents).toHaveLength(0)
  })
})

