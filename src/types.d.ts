import type { ModuleOptions } from './module'

// Define the type for the runtime-config,.
// see https://nuxt.com/docs/guide/going-further/runtime-config#manually-typing-runtime-config
declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    drupalCe: ModuleOptions,
  }

  // Extend NuxtOptions to include drupalCe.
  interface NuxtOptions {
    drupalCe: ModuleOptions,
  }
}
