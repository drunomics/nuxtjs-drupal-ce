import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { join } from 'node:path'

describe('Component Preview Integration', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    configFile: 'nuxt.config4test',
    port: 3002,
  })

  it('generates component index', async () => {
    const json = await $fetch('/nuxt-component-preview/component-index.json')
    expect(json).toBeDefined()
    expect(json.components).toBeDefined()
    expect(Array.isArray(json.components)).toBe(true)
  })

  it('excludes drupal-* prefixed components by default', async () => {
    const json = await $fetch('/nuxt-component-preview/component-index.json')
    const drupalComponents = json.components.filter((c: any) => c.name.startsWith('Drupal'))
    expect(drupalComponents).toHaveLength(0)
  })
})
