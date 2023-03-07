import { fileURLToPath } from 'url'
import { defineNuxtModule, addPlugin, createResolver, addImportsDir } from '@nuxt/kit'
import { UseFetchOptions } from 'nuxt/dist/app/composables'
import { defu } from 'defu'

export interface ModuleOptions {
  baseURL: string,
  menuEndpoint: string,
  addRequestContentFormat?: string,
  customErrorPages: boolean,
  fetchOptions: UseFetchOptions<any>,
  fetchProxyHeaders: string[],
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxtjs-drupal-ce',
    configKey: 'drupalCe'
  },
  defaults: {
    baseURL: 'https://8080-shaal-drupalpod-xxxxxxxxxxx.ws-xxxx.gitpod.io/ce-api',
    menuEndpoint: 'api/menu_items/$$$NAME$$$',
    customErrorPages: false,
    fetchOptions: {},
    fetchProxyHeaders: ['cookie']
  },
  setup (options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    addPlugin(resolve(runtimeDir, 'plugin'))
    addImportsDir(resolve(runtimeDir, 'composables'))

    nuxt.options.runtimeConfig.public.drupalCe = defu(nuxt.options.runtimeConfig.public.drupalCe ?? {}, options)
  }
})

// Define the type for the runtime-config,.
// see https://nuxt.com/docs/guide/going-further/runtime-config#manually-typing-runtime-config
declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    drupalCe: ModuleOptions,
  }
}