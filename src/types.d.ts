import type { ModuleOptions } from './module'

/**
 * A single custom element object with element name and props
 */
export interface CustomElementContentObject {
  element: string
  [key: string]: any
}

/**
 * JSON-serialized custom elements content for rendering.
 *
 * Can be:
 * - null/undefined (returns null, skipping render)
 * - string (treated as HTML)
 * - single custom element object with {element: string, ...props}
 * - array of strings or custom element objects (treated as HTML)
 */
export type CustomElementContent =
  | null
  | undefined
  | string
  | CustomElementContentObject
  | Array<string | CustomElementContentObject>

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
