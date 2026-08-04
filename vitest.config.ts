// vitest.config.ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'packaging',
          include: ['test/packaging.test.ts'],
          environment: 'node',
        }
      },
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/*.{test,spec}.ts'],
          environment: 'node',
          fileParallelism: false,
          retry: 1,
        }
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: {
            // Own port: the six e2e suites built on nuxt.config4test.ts are
            // locked to 3001 (self-referencing drupalBaseUrl), and vitest
            // interleaves project files in one worker pool.
            port: 3021,
            nuxt: {
              rootDir: fileURLToPath(new URL('./playground', import.meta.url)),
              port: 3021,
              overrides: {
                modules: ['../dist/module.mjs'],
                drupalCe: {
                  drupalBaseUrl: 'http://127.0.0.1:3021',
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
