import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import DrupalCe from '../../../src/module'

const playgroundDir = resolve(fileURLToPath(import.meta.url), '../../../../playground')

export default defineNuxtConfig({
  modules: [
    DrupalCe,
  ],
  compatibilityDate: '2024-12-16',
  drupalCe: {
    drupalBaseUrl: 'http://127.0.0.1:3010',
    ceApiEndpoint: '/ce-api',
    enableComponentPreview: false,
  },
  nitro: {
    prerender: {
      routes: ['/node/1', '/node/3'],
      crawlLinks: false,
      failOnError: true,
    },
  },
  // Use playground's components and pages
  components: [
    { path: resolve(playgroundDir, 'components'), pathPrefix: false },
  ],
  dir: {
    pages: resolve(playgroundDir, 'pages'),
    layouts: resolve(playgroundDir, 'layouts'),
  },
})
