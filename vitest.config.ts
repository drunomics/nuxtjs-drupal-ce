// vitest.config.ts
import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        rootDir: fileURLToPath(new URL('.', import.meta.url)),
        overrides: {
          modules: ['./dist/module.mjs'],
          drupalCe: {
            drupalBaseUrl: 'http://127.0.0.1:3001',
            ceApiEndpoint: '/api',
          }
        }
      }
    }
  }
})
