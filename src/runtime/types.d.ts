import type { NuxtOptions } from '@nuxt/schema'
import type { ModuleOptions } from '../module'

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
  | JsonRenderSpec
  | Array<string | CustomElementContentObject>

/**
 * One element of a json-render spec.
 *
 * `children` and slot entries reference other elements of the spec by key.
 * A `drupal-markup` element carries inline HTML in `props.markup`.
 */
export interface JsonRenderElement {
  type: string
  props?: Record<string, any>
  children?: string[]
  slots?: Record<string, string[]>
}

/**
 * json-render format custom elements content: a flat element map plus the key
 * of the root element, as emitted by custom_elements' json-render output
 * format (drupal.org/project/custom_elements, issue #3580092).
 */
export interface JsonRenderSpec {
  root: string
  elements: Record<string, JsonRenderElement>
}

/**
 * Metatags structure
 */
export interface DrupalCeMetatags {
  meta: Array<Record<string, any>>
  link: Array<Record<string, any>>
  jsonld: Array<any>
}

/**
 * Local tasks (tabs) structure
 */
export interface DrupalCeLocalTasks {
  primary: Array<any>
  secondary: Array<any>
}

/**
 * Redirect response from the API (causes navigation, never stored in page state)
 */
export interface DrupalCeRedirectResponse {
  redirect: {
    url: string
    external: boolean
    statusCode: number
  }
}

/**
 * Page response object returned by fetchPage() and getPage()
 * This is the actual page data stored in state after fetching
 */
export interface DrupalCePage {
  breadcrumbs: Array<any>
  content: CustomElementContent | Record<string, any>
  content_format: string
  local_tasks: DrupalCeLocalTasks
  settings: Record<string, any>
  messages: Array<any>
  metatags: DrupalCeMetatags
  page_layout: string
  title: string
  key?: string  // Unique identifier used by useFetch caching
}

/**
 * API response can be either a page or a redirect
 * Used internally when fetching from the API
 */
export type DrupalCeApiResponse = DrupalCePage | DrupalCeRedirectResponse

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
