import { setResponseHeader, getRequestHeader } from 'h3'
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

/**
 * Sets CORS headers at runtime for component preview requests.
 *
 * Uses beforeResponse to run for ALL requests including static assets,
 * ensuring the runtime drupalBaseUrl is used even when it differs from
 * build-time. Only sets headers when the request origin matches the
 * Drupal backend, so regular requests are unaffected.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
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
    if (!origin || origin !== corsOrigin) {
      return
    }

    setResponseHeader(event, 'Access-Control-Allow-Origin', corsOrigin)
    setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET')
    setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
  })
})
