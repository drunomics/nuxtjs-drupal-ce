import { defineNuxtConfig } from 'nuxt/config'
import DrupalCe from '..'

export default defineNuxtConfig({
  modules: [
    DrupalCe,
  ],
  drupalCe: {
    drupalBaseUrl: 'http://127.0.0.1:3001',
    ceApiEndpoint: '/api',
  },
})
