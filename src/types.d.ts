import type { ModuleOptions } from './module'

/**
 * Explicit format custom element with separated props and slots
 */
export interface CustomElementExplicitContent {
  element: string
  props?: Record<string, any>
  slots?: Record<string, CustomElementContent>
}

/**
 * Legacy format custom element with mixed props and slots at root level
 */
export interface CustomElementLegacyContent {
  element: string
  [key: string]: any
}

/**
 * A single custom element object - supports both explicit and legacy formats
 */
export type CustomElementContentObject =
  | CustomElementExplicitContent
  | CustomElementLegacyContent

/**
 * JSON-serialized custom elements content for rendering.
 *
 * Can be:
 * - null/undefined (returns null, skipping render)
 * - string (treated as HTML)
 * - single custom element object in explicit format: {element: string, props?: {}, slots?: {}}
 * - single custom element object in legacy format: {element: string, ...props}
 * - array of strings (treated as HTML) or custom element objects
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
