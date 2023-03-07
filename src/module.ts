import { fileURLToPath } from 'url'
import { defineNuxtModule, addPlugin, createResolver, addImportsDir } from '@nuxt/kit'
import { UseFetchOptions } from 'nuxt/dist/app/composables'

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
    fetchOptions: {
      credentials: 'include'
    },
    fetchProxyHeaders: ['cookie']
  },
  setup (options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    addPlugin(resolve(runtimeDir, 'plugin'))
    addImportsDir(resolve(runtimeDir, 'composables'))
    nuxt.options.runtimeConfig.public.drupalCe = {
      baseURL: options.baseURL,
      menuEndpoint: options.menuEndpoint,
      addRequestContentFormat: options.addRequestContentFormat,
      customErrorPages: options.customErrorPages,
      fetchOptions: options.fetchOptions,
      fetchProxyHeaders: options.fetchProxyHeaders
    }
  }
})
