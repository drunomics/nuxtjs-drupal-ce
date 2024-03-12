
import type { ModuleOptions } from './module'


declare module '@nuxt/schema' {
  interface NuxtConfig { ['drupalCe']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['drupalCe']?: ModuleOptions }
}

declare module 'nuxt/schema' {
  interface NuxtConfig { ['drupalCe']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['drupalCe']?: ModuleOptions }
}


export type { ModuleOptions, default } from './module'
