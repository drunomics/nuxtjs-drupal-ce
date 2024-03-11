import { defineNuxtConfig } from 'nuxt/config'
import DrupalCe from '..'

export default defineNuxtConfig({
  modules: [
    DrupalCe
  ],
  drupalCe: {
    baseURL: '/api',
    serverApiProxy: false // to-do: improve tests to cover this option
  }
})
