import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import DrupalCe from '../'

describe('Module @nuxtjs/i18n integration works', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    nuxtConfig: {
      modules: [
        DrupalCe,
        '@nuxtjs/i18n'
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3003',
        ceApiEndpoint: '/api',
        serverApiProxy: false
      },
      i18n: {
        locales: ['en', 'de'],
        defaultLocale: 'en',
        detectBrowserLanguage: false
      }
    },
    port: 3003
  })
  it('language switcher renders', async () => {
    const html = await $fetch('/')
    expect(html).toContain('language-switcher')
  })
  it('switching language works', async () => {
    let html = await $fetch('/')
    expect(html).toContain('Welcome to your custom-elements enabled Drupal site')
    html = await $fetch('/de')
    expect(html).toContain('Willkommen auf Ihrer Drupal-Website mit benutzerdefinierten Elementen')
  })
  it('correct menu is rendered', async () => {
    let html = await $fetch('/')
    expect(html).toContain('Another page')
    html = await $fetch('/de')
    expect(html).toContain('Eine andere Seite')
  })
})
