import { setResponseHeader, getRequestHeader, getResponseHeader } from 'h3'
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

    // Always vary on Origin so a response cached without CORS headers (e.g.
    // fetched by the SSR server or a same-origin request without an Origin
    // header) is not reused for cross-origin requests that need the CORS
    // headers set below.
    const existingVary = getResponseHeader(event, 'Vary')
    const varyTokens = existingVary
      ? String(Array.isArray(existingVary) ? existingVary.join(',') : existingVary)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      : []
    if (!varyTokens.some(t => t.toLowerCase() === 'origin')) {
      varyTokens.push('Origin')
      setResponseHeader(event, 'Vary', varyTokens.join(', '))
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
