import { fileURLToPath } from 'url'
import { defineNuxtModule, addPlugin, createResolver, addImportsDir, addServerHandler } from '@nuxt/kit'
import type { UseFetchOptions } from 'nuxt/dist/app/composables'
import { defu } from 'defu'

export interface ModuleOptions {
  baseURL?: string,
  drupalBaseUrl: string,
  serverDrupalBaseUrl?: string,
  ceApiEndpoint: string,
  menuEndpoint: string,
  menuBaseUrl?: string,
  addRequestContentFormat?: string,
  addRequestFormat: boolean,
  customErrorPages: boolean,
  fetchOptions: UseFetchOptions<any>,
  fetchProxyHeaders: string[],
  useLocalizedMenuEndpoint: boolean,
  exposeAPIRouteRules: boolean,
  passThroughHeaders?: string[],
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxtjs-drupal-ce',
    configKey: 'drupalCe',
    compatibility: {
      nuxt: '^3.2.2'
    },
  },
  defaults: {
    drupalBaseUrl: '',
    ceApiEndpoint: '/ce-api',
    menuEndpoint: 'api/menu_items/$$$NAME$$$',
    customErrorPages: false,
    fetchOptions: {
      credentials: 'include',
    },
    fetchProxyHeaders: ['cookie'],
    useLocalizedMenuEndpoint: true,
    addRequestFormat: false,
    exposeAPIRouteRules: true,
    passThroughHeaders: ['cache-control', 'content-language', 'set-cookie', 'x-drupal-cache', 'x-drupal-dynamic-cache'],
  },
  setup (options, nuxt) {
    // Keep backwards compatibility for baseURL(deprecated).
    if (options.baseURL && options.baseURL.startsWith('http')) {
      const baseURL = new URL(options.baseURL)
      if (!options.drupalBaseUrl) {
        options.drupalBaseUrl = baseURL.origin
      }
      options.ceApiEndpoint = baseURL.pathname
    } else if (!options.baseURL) {
      options.baseURL = options.drupalBaseUrl + options.ceApiEndpoint
    }

    if (!options.menuBaseUrl) {
      options.menuBaseUrl = options.drupalBaseUrl + options.ceApiEndpoint
    }

    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    addPlugin(resolve(runtimeDir, 'plugin'))
    addImportsDir(resolve(runtimeDir, 'composables'))

    nuxt.options.runtimeConfig.public.drupalCe = defu(nuxt.options.runtimeConfig.public.drupalCe ?? {}, options)

    if (options.exposeAPIRouteRules === true) {
      addServerHandler({
        route: '/api/drupal-ce',
        handler: resolve(runtimeDir, 'server/api/drupalCe')
      })
      addServerHandler({
        route: '/api/drupal-ce/**',
        handler: resolve(runtimeDir, 'server/api/drupalCe')
      })
      addServerHandler({
        route: '/api/menu/**',
        handler: resolve(runtimeDir, 'server/api/menu')
      })
    }
  }
})

// Define the type for the runtime-config,.
// see https://nuxt.com/docs/guide/going-further/runtime-config#manually-typing-runtime-config
declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    drupalCe: ModuleOptions,
  }
}
