import { defineNuxtConfig } from 'nuxt/config'
import DrupalCe from '..'

export default defineNuxtConfig({
  modules: [
    DrupalCe,
  ],
  compatibilityDate: '2024-12-16',
  nitro: {
    compressPublicAssets: true,
  },
  drupalCe: {
    drupalBaseUrl: 'http://127.0.0.1:3000',
    ceApiEndpoint: '/ce-api',
  },
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
    detectBrowserLanguage: false,
  },
})
