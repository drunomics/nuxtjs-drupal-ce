import { setResponseHeader, getRequestHeader } from 'h3'
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

/**
 * Sets CORS headers at runtime for component preview paths.
 *
 * Uses beforeResponse to run for ALL requests including static /_nuxt/ assets,
 * ensuring the runtime drupalBaseUrl is used even when it differs from build-time.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    const path = event.path?.split('?')[0] || ''
    if (!path.startsWith('/_nuxt/') && !path.startsWith('/nuxt-component-preview/')) {
      return
    }

    const drupalBaseUrl = useRuntimeConfig().public.drupalCe?.drupalBaseUrl
    if (!drupalBaseUrl) {
      return
    }

    let corsOrigin: string
    try {
      corsOrigin = new URL(drupalBaseUrl).origin
    }
    catch {
      return
    }

    const origin = getRequestHeader(event, 'origin')
    // Only set CORS headers when the request comes from the Drupal backend.
    if (origin && origin !== corsOrigin) {
      return
    }

    setResponseHeader(event, 'Access-Control-Allow-Origin', corsOrigin)
    setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET')
    setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
  })
})
