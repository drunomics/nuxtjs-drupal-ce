import { fileURLToPath } from 'url'
import { defineNuxtModule, addPlugin, createResolver, addImportsDir } from '@nuxt/kit'
import { UseFetchOptions } from 'nuxt/dist/app/composables'
import { defu } from 'defu'

export interface ModuleOptions {
  baseURL: string,
  menuEndpoint: string,
  addRequestContentFormat?: string,
  addRequestFormat: boolean,
  customErrorPages: boolean,
  fetchOptions: UseFetchOptions<any>,
  fetchProxyHeaders: string[],
  useLocalizedMenuEndpoint: boolean,
  exposeAPIRouteRules: boolean,
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
    baseURL: 'https://8080-shaal-drupalpod-xxxxxxxxxxx.ws-xxxx.gitpod.io/ce-api',
    menuEndpoint: 'api/menu_items/$$$NAME$$$',
    customErrorPages: false,
    fetchOptions: {
      credentials: 'include',
    },
    fetchProxyHeaders: ['cookie'],
    useLocalizedMenuEndpoint: true,
    addRequestFormat: false,
    exposeAPIRouteRules: true
  },
  setup (options, nuxt) {
    if (nuxt.options._generate) {
      // Disable the route rules for static sites.
      options.exposeAPIRouteRules = false
    }

    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    addPlugin(resolve(runtimeDir, 'plugin'))
    addImportsDir(resolve(runtimeDir, 'composables'))

    nuxt.options.runtimeConfig.public.drupalCe = defu(nuxt.options.runtimeConfig.public.drupalCe ?? {}, options)

    if (options.exposeAPIRouteRules === true) {
      // Check if absolute URL or path, if an absolute then extract the origin.
      const baseURLOrigin = /^(http|https):\/\//.test(options.baseURL) ? new URL(options.baseURL).origin : options.baseURL
      const defaultRouteRules: Record<string, { proxy: string, swr?: number }> = {
        '/api/drupal/**': { proxy: baseURLOrigin + '/**' },
        '/api/drupal-ce/**': { proxy: options.baseURL + '/**' },
        '/api/menu/**': { proxy: baseURLOrigin + '/api/menu_items/**', swr: 300 }
      }

      if (nuxt.options.nitro?.routeRules) {
        nuxt.options.nitro.routeRules = defu(nuxt.options.nitro.routeRules, defaultRouteRules) as { [path: string]: { proxy: string, swr?: number } }
      } else {
        nuxt.options.nitro = { routeRules: defaultRouteRules }
      }
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
