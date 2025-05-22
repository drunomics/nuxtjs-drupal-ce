// vitest.config.ts
import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environmentOptions: {
      nuxt: {
        rootDir: fileURLToPath(new URL('./playground', import.meta.url)),
        port: 3001,
        overrides: {
          modules: ['../dist/module.mjs'],
          drupalCe: {
            drupalBaseUrl: 'http://127.0.0.1:3001',
            ceApiEndpoint: '/ce-api',
          }
        }
      }
    },
    testTimeout: 10000,
  }
})
