import type { ModuleOptions } from './module'

/**
 * JSON-serialized custom elements content to render.
 *
 * Can be:
 * - null/undefined (returns null, skipping render)
 * - string (rendered inside a wrapping div element)
 * - single custom element object with {element: string, ...props}
 * - array of strings or custom element objects (rendered inside a wrapping div element)
 */
export type CustomElementContent =
  | null
  | undefined
  | string
  | Record<string, any>
  | Array<string | Record<string, any>>

// Define the type for the runtime-config,.
// see https://nuxt.com/docs/guide/going-further/runtime-config#manually-typing-runtime-config
declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    drupalCe: ModuleOptions
  }
}

export interface NuxtOptionsWithDrupalCe extends NuxtOptions {
  drupalCe?: ModuleOptions
}
