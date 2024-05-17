import { fileURLToPath } from 'url'
import { defineNuxtModule, addPlugin, addServerPlugin, createResolver, addImportsDir, addServerHandler } from '@nuxt/kit'
import { defu } from 'defu'
import type { NuxtOptionsWithDrupalCe } from './types'

export interface ModuleOptions {
  drupalBaseUrl: string,
  serverDrupalBaseUrl?: string,
  ceApiEndpoint: string,
  menuEndpoint: string,
  menuBaseUrl?: string,
  addRequestContentFormat?: string,
  addRequestFormat: boolean,
  customErrorPages: boolean,
  fetchOptions: Object,
  fetchProxyHeaders: string[],
  useLocalizedMenuEndpoint: boolean,
  serverApiProxy: boolean,
  passThroughHeaders?: string[],
  exposeAPIRouteRules?: boolean,
  serverLogLevel?: boolean | 'info' | 'error',
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxtjs-drupal-ce',
    configKey: 'drupalCe',
    compatibility: {
      nuxt: '^3.7.0',
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
    serverApiProxy: true,
    passThroughHeaders: ['cache-control', 'content-language', 'set-cookie', 'x-drupal-cache', 'x-drupal-dynamic-cache'],
    serverLogLevel: 'info',
  },
  setup (options, nuxt) {
    const nuxtOptions = nuxt.options as NuxtOptionsWithDrupalCe
    // Keep backwards compatibility for exposeAPIRouteRules(deprecated).
    if (!nuxtOptions.drupalCe?.serverApiProxy && options.exposeAPIRouteRules !== undefined) {
      options.serverApiProxy = options.exposeAPIRouteRules
    }

    // Disable the server routes for static sites.
    if (nuxt.options._generate) {
      options.serverApiProxy = false
    }

    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    addPlugin(resolve(runtimeDir, 'plugin'))
    if (options.serverLogLevel) {
      addServerPlugin(resolve(runtimeDir, 'server/plugins/errorLogger'))
    }
    addImportsDir(resolve(runtimeDir, 'composables/useDrupalCe'))

    const publicOptions = { ...options }
    // Server options are not needed in the client bundle.
    delete publicOptions.serverLogLevel
    delete publicOptions.passThroughHeaders
    delete publicOptions.exposeAPIRouteRules

    nuxt.options.runtimeConfig.public.drupalCe = defu(nuxt.options.runtimeConfig.public.drupalCe ?? {}, publicOptions)

    nuxt.options.runtimeConfig.drupalCe = defu(nuxt.options.runtimeConfig.drupalCe ?? {}, {
      serverLogLevel: options.serverLogLevel as string,
      passThroughHeaders: options.passThroughHeaders,
    })

    if (options.serverApiProxy === true) {
      addServerHandler({
        route: '/api/drupal-ce',
        handler: resolve(runtimeDir, 'server/api/drupalCe'),
      })
      addServerHandler({
        route: '/api/drupal-ce/**',
        handler: resolve(runtimeDir, 'server/api/drupalCe'),
      })
      addServerHandler({
        route: '/api/menu/**',
        handler: resolve(runtimeDir, 'server/api/menu'),
      })
    }
  },
})
