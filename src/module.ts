import { defineNuxtModule, addServerPlugin, createResolver, addImportsDir, addServerHandler, addImports, installModule } from '@nuxt/kit'
import { defu } from 'defu'
import type { NuxtOptionsWithDrupalCe } from './types'

function getCorsOrigin(nuxt: any): string | null {
  const drupalBaseUrl = nuxt.options.runtimeConfig.public.drupalCe.drupalBaseUrl

  if (!drupalBaseUrl) {
    return null
  }

  try {
    const url = new URL(drupalBaseUrl)
    return url.origin
  }
  catch {
    console.warn('[nuxtjs-drupal-ce] Invalid drupalBaseUrl:', drupalBaseUrl)
    return null
  }
}

function setupCors(nuxt: any, corsOrigin: string) {
  if (nuxt.options.dev) {
    nuxt.options.vite = nuxt.options.vite || {}
    nuxt.options.vite.server = nuxt.options.vite.server || {}
    nuxt.options.vite.server.cors = defu(nuxt.options.vite.server.cors, {
      origin: [corsOrigin],
      credentials: true,
    })
  }

  nuxt.options.nitro = nuxt.options.nitro || {}
  nuxt.options.nitro.routeRules = nuxt.options.nitro.routeRules || {}

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  }

  nuxt.options.nitro.routeRules['/_nuxt/**'] = defu(
    nuxt.options.nitro.routeRules['/_nuxt/**'],
    { headers: corsHeaders }
  )

  nuxt.options.nitro.routeRules['/nuxt-component-preview/**'] = defu(
    nuxt.options.nitro.routeRules['/nuxt-component-preview/**'],
    { headers: corsHeaders }
  )
}

export interface ModuleOptions {
  drupalBaseUrl: string
  serverDrupalBaseUrl?: string
  ceApiEndpoint: string
  menuEndpoint: string
  menuBaseUrl?: string
  addRequestContentFormat?: string
  addRequestFormat: boolean
  customErrorPages: boolean
  customElementJsonFormat: 'explicit' | 'legacy'
  fetchOptions: object
  fetchProxyHeaders: string[]
  useLocalizedMenuEndpoint: boolean
  serverApiProxy: boolean
  passThroughHeaders?: string[]
  exposeAPIRouteRules?: boolean
  serverLogLevel?: boolean | 'info' | 'error'
  disableFormHandler?: boolean | string[]
  enableComponentPreview?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxtjs-drupal-ce',
    configKey: 'drupalCe',
    compatibility: {
      nuxt: '>=3.7.0',
    },
  },
  defaults: {
    drupalBaseUrl: '',
    ceApiEndpoint: '/ce-api',
    menuEndpoint: 'api/menu_items/$$$NAME$$$',
    customErrorPages: false,
    customElementJsonFormat: 'explicit',
    fetchOptions: {
      credentials: 'include',
    },
    fetchProxyHeaders: ['cookie'],
    useLocalizedMenuEndpoint: true,
    addRequestFormat: false,
    serverApiProxy: true,
    passThroughHeaders: ['cache-control', 'content-language', 'set-cookie', 'x-drupal-cache', 'x-drupal-dynamic-cache'],
    serverLogLevel: 'info',
    disableFormHandler: false,
    enableComponentPreview: true,
  },
  async setup(options, nuxt) {
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
    const runtimeDir = resolve('./runtime')
    nuxt.options.build.transpile.push(runtimeDir)
    if (options.serverLogLevel) {
      addServerPlugin(resolve(runtimeDir, 'server/plugins/errorLogger'))
    }
    addImportsDir(resolve(runtimeDir, 'composables/useDrupalCe'))

    // Add form handler middleware if not disabled (via boolean)
    if (!(options.disableFormHandler === true)) {
      addServerHandler({
        handler: resolve(runtimeDir, 'server/middleware/drupalFormHandler'),
      })
    }

    const publicOptions = { ...options }
    // Server options are not needed in the client bundle.
    delete publicOptions.serverLogLevel
    delete publicOptions.passThroughHeaders
    delete publicOptions.exposeAPIRouteRules
    delete publicOptions.disableFormHandler

    nuxt.options.runtimeConfig.public.drupalCe = defu(nuxt.options.runtimeConfig.public.drupalCe ?? {}, publicOptions)

    nuxt.options.runtimeConfig.drupalCe = defu(nuxt.options.runtimeConfig.drupalCe ?? {}, {
      serverLogLevel: options.serverLogLevel as string,
      passThroughHeaders: options.passThroughHeaders,
      disableFormHandler: options.disableFormHandler,
    })

    if (options.enableComponentPreview !== false) {
      await installModule('nuxt-component-preview')

      const corsOrigin = getCorsOrigin(nuxt)

      if (!corsOrigin) {
        console.warn('[nuxtjs-drupal-ce] Component preview enabled but could not derive CORS origin from drupalBaseUrl')
      }
      else {
        setupCors(nuxt, corsOrigin)

        if (nuxt.options.dev) {
          nuxt.options.experimental = nuxt.options.experimental || {}
          nuxt.options.experimental.appManifest = false
          console.info('[nuxtjs-drupal-ce] Component preview enabled with CORS origin:', corsOrigin)
        }
      }
    }

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

    // Types to be auto-imported.
    addImports([
      {
        name: 'CustomElementContent',
        from: resolve('./types.d.ts'),
        type: true
      },
    ])
  },
})
