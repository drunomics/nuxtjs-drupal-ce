import { defineNuxtConfig } from 'nuxt/config'
import DrupalCe from '../../../src/module'

export default defineNuxtConfig({
  modules: [DrupalCe],
  compatibilityDate: '2026-09-07',
  drupalCe: {
    drupalBaseUrl: 'http://127.0.0.1:3041',
    ceApiEndpoint: '/ce-api',
    enableComponentPreview: false,
  },
})
