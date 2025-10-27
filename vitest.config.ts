// vitest.config.ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/e2e/*.{test,spec}.ts'],
          environment: 'node',
        }
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: {
            port: 3001,
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
          }
        }
      })
    ]
  }
})
