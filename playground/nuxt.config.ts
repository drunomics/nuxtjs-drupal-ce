import { defineNuxtConfig } from 'nuxt/config'
import DrupalCe from '..'

export default defineNuxtConfig({
  modules: [
    DrupalCe,
  ],
  compatibilityDate: '2024-12-16',
  drupalCe: {
    drupalBaseUrl: 'http://127.0.0.1:3000',
    ceApiEndpoint: '/ce-api',
  },
  vue: {
    runtimeCompiler: true,
  },
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
    detectBrowserLanguage: false,
  },
})
