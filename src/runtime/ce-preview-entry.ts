import { createApp, App as VueApp } from 'vue'
import type { NuxtApp } from 'nuxt/app'

// This file must be imported first as we set globalThis.$fetch via this import
import '#build/fetch.mjs'

import { applyPlugins, createNuxtApp } from './nuxt'
import { createError } from './composables/error'

import '#build/css'
import plugins from '#build/plugins'
import RootComponent from '#build/root-component.mjs'

// Export preview component function directly
export { previewComponent } from './ce-preview-utils'

// Callback storage
const _readyCallbacks: Array<(context: { nuxtApp: NuxtApp, vueApp: VueApp }) => void> = []

/**
 * Initialize Nuxt but don't mount it
 */
export async function initializeNuxt(): Promise<{ nuxtApp: NuxtApp, vueApp: VueApp }> {
  // Create the Vue app
  const vueApp = createApp(RootComponent)

  // Create Nuxt app instance (without mounting)
  const nuxtApp = createNuxtApp({ vueApp })

  // Error handling
  async function handleVueError(error: any) {
    await nuxtApp.callHook('app:error', error)
    nuxtApp.payload.error ||= createError(error)
  }

  vueApp.config.errorHandler = handleVueError

  try {
    // Apply plugins (critical for component registration and lazy loading)
    await applyPlugins(nuxtApp, plugins)

    // Call created hook
    await nuxtApp.hooks.callHook('app:created', vueApp)

    // Call all ready callbacks
    const context = { nuxtApp, vueApp }
    _readyCallbacks.forEach(callback => callback(context))
    _readyCallbacks.length = 0
  } catch (err) {
    handleVueError(err)
  }

  return { nuxtApp, vueApp }
}

/**
 * Register a callback to run when Nuxt is initialized
 */
export function onNuxtReady(callback: (context: { nuxtApp: NuxtApp, vueApp: VueApp }) => void): void {
  _readyCallbacks.push(callback)
}

// Initialize immediately but don't mount
if (typeof window !== 'undefined') {
  initializeNuxt()
}
