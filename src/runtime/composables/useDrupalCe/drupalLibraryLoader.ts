/**
 * Lazy loader for Drupal JavaScript libraries in the decoupled frontend.
 *
 * This module is intentionally standalone (no Vue/Nuxt imports) and is only
 * ever reached through a dynamic `import()` from `useDrupalCe().loadLibrary()`,
 * so Vite splits it into its own chunk: neither the loader nor the Drupal JS it
 * pulls in is shipped until a component actually loads a library.
 *
 * Loading is coordinated through a module-level queue so scripts execute in the
 * order they are requested (dependencies before dependents, which the backend
 * resolves) and `Drupal.attachBehaviors()` runs exactly once per batch.
 */

/** A single JS file of a Drupal library. */
export interface DrupalLibraryJsFile {
  /** Root-relative (e.g. `/core/misc/states.js?v=…`) or absolute URL. */
  url: string
  /** Optional attributes for the `<script>` tag (reserved). */
  attributes?: Record<string, unknown>
}

/** A resolved Drupal library: its JS files (in load order) and merged settings. */
export interface DrupalResolvedLibrary {
  /** The library's JS files, in dependency order. */
  js: DrupalLibraryJsFile[]
  /** Merged drupalSettings as a JSON string (kept opaque so keys survive). */
  drupalSettings?: string
}

/** URLs already loaded, so a library shared by several callers loads once. */
const loadedScripts = new Set<string>()

/** Serialises loading so scripts execute in request order across callers. */
let queue: Promise<void> = Promise.resolve()

/** Outstanding loads in the current batch; behaviours attach when it hits 0. */
let pending = 0

/**
 * Resolves a library URL against the Drupal backend.
 *
 * @param url - Root-relative or absolute URL from the backend.
 * @param baseUrl - The Drupal backend base URL.
 * @returns A browser-loadable absolute URL.
 */
function absoluteUrl(url: string, baseUrl: string): string {
  if (/^(https?:)?\/\//.test(url)) {
    return url
  }
  return baseUrl.replace(/\/$/, '') + url
}

/**
 * Injects a `<script>` for the given source, once.
 *
 * Already-loaded sources resolve immediately. A load error resolves (not
 * rejects) with a warning so one missing asset does not abort a library or the
 * behaviours: some Drupal "JS" is generated per request (e.g. locale
 * translations) and legitimately 404s in a decoupled context.
 *
 * @param src - The absolute script URL to load.
 * @returns A promise that settles when the script has loaded (or failed).
 */
function loadScript(src: string): Promise<void> {
  if (loadedScripts.has(src) || document.querySelector(`script[data-drupal-library="${CSS.escape(src)}"]`)) {
    loadedScripts.add(src)
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const el = document.createElement('script')
    el.src = src
    // Keep execution order deterministic even though the src is set eagerly.
    el.async = false
    el.dataset.drupalLibrary = src
    el.onload = () => {
      loadedScripts.add(src)
      resolve()
    }
    el.onerror = () => {
      console.warn(`[drupal-library] skipped, failed to load ${src}`)
      resolve()
    }
    document.head.appendChild(el)
  })
}

/**
 * Type guard for a plain (non-array) object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Recursively deep-merges `source` into `target`, mutating `target`.
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const next = source[key]
    if (isPlainObject(next) && isPlainObject(target[key])) {
      deepMerge(target[key] as Record<string, unknown>, next)
    }
    else {
      target[key] = next
    }
  }
  return target
}

/**
 * Rewrites root-relative URLs in the AJAX section of drupalSettings to absolute
 * backend URLs, mutating `settings` in place.
 *
 * Core builds a form element's `#ajax` url from `Url::fromRoute('<current>')`,
 * which serialises to a root-relative path (e.g. `/form/x?…`). On a decoupled
 * page that resolves against the *frontend* origin, so `Drupal.ajax` would POST
 * to the frontend, which runs no Drupal, and the request never reaches the
 * backend (the managed_file upload symptom: clicking "Upload" produces no
 * request at all). Rewriting the url — and the optional progress url — against
 * the backend base URL points it at the backend, which serves the frontend's
 * origin with credentialed CORS.
 *
 * `ajaxTrustedUrl` is re-keyed to match: `ajax.js` throws "The callback URL is
 * not local and not trusted" for a cross-origin url absent from that map, and
 * trusted urls also bypass its multipart-upload response-token check. Idempotent
 * — an already-absolute url passes through `absoluteUrl` unchanged.
 */
function absolutizeAjaxSettings(settings: Record<string, unknown>, baseUrl: string): void {
  const ajax = settings.ajax
  if (isPlainObject(ajax)) {
    for (const entry of Object.values(ajax)) {
      if (!isPlainObject(entry)) {
        continue
      }
      if (typeof entry.url === 'string') {
        entry.url = absoluteUrl(entry.url, baseUrl)
      }
      const progress = entry.progress
      if (isPlainObject(progress) && typeof progress.url === 'string') {
        progress.url = absoluteUrl(progress.url, baseUrl)
      }
    }
  }
  const trusted = settings.ajaxTrustedUrl
  if (isPlainObject(trusted)) {
    const rekeyed: Record<string, unknown> = {}
    for (const [url, value] of Object.entries(trusted)) {
      rekeyed[absoluteUrl(url, baseUrl)] = value
    }
    settings.ajaxTrustedUrl = rekeyed
  }
}

/**
 * Runs Drupal.attachBehaviors on the document, if Drupal has loaded.
 *
 * Safe to call repeatedly: Drupal's `once()` prevents re-processing.
 */
function attachBehaviors(): void {
  const drupal = (window as unknown as { Drupal?: { attachBehaviors?: (el: Element, settings?: unknown) => void } }).Drupal
  const settings = (window as unknown as { drupalSettings?: unknown }).drupalSettings
  drupal?.attachBehaviors?.(document.body, settings)
}

/**
 * Loads a resolved Drupal library, then attaches behaviours once the batch is
 * done.
 *
 * `drupalSettings` (if any) is merged into `window.drupalSettings` synchronously
 * before any script runs — Drupal core JS expects it to exist, and a decoupled
 * page has no settings-json `<script>` for `drupalSettingsLoader.js` to read.
 * Files are appended to the shared queue so they load after earlier requests;
 * when the queue drains, behaviours attach once.
 *
 * @param library - The resolved library (JS files + optional drupalSettings).
 * @param baseUrl - The Drupal backend base URL for resolving root-relative URLs.
 * @returns A promise that settles once this library's files have loaded.
 */
export function loadDrupalLibrary(library: DrupalResolvedLibrary, baseUrl: string): Promise<void> {
  if (library.drupalSettings) {
    try {
      const win = window as unknown as { drupalSettings?: Record<string, unknown> }
      win.drupalSettings = deepMerge(win.drupalSettings ?? {}, JSON.parse(library.drupalSettings))
      // The merged settings carry the backend's root-relative AJAX urls; point
      // them at the backend so Drupal.ajax reaches it instead of the frontend.
      absolutizeAjaxSettings(win.drupalSettings, baseUrl)
    }
    catch (error) {
      console.error('[drupal-library] invalid drupalSettings', error)
    }
  }

  const urls = (library.js ?? []).map(file => absoluteUrl(file.url, baseUrl))

  pending++
  const done = queue
    .then(async () => {
      for (const url of urls) {
        await loadScript(url)
      }
    })
    .catch(error => console.error(error))
    .finally(() => {
      pending--
      if (pending === 0) {
        attachBehaviors()
      }
    })
  queue = done
  return done
}
