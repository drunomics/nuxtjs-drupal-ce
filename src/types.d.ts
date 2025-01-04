// types.ts
import type { ModuleOptions } from './module'

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    drupalCe: ModuleOptions
  }
}

declare module 'nitropack' {
  interface RouteRules {
    drupalCeApiProxy?: boolean
  }
}

export interface NuxtOptionsWithDrupalCe extends NuxtOptions {
  drupalCe?: ModuleOptions
}
