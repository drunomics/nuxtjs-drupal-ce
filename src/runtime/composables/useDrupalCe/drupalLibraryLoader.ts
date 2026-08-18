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
 * Seeds drupalSettings for the decoupled page.
 *
 * Merges the backend's settings into `window.drupalSettings` and writes them to
 * the `drupal-settings-json` `<script>` element that core's
 * `drupalSettingsLoader.js` reads. That element is essential:
 * `drupalSettingsLoader.js` unconditionally resets `window.drupalSettings` to
 * `{}` and only repopulates it from that element, so a plain in-memory merge is
 * wiped the moment core JS runs and behaviours (e.g. AJAX, which builds its
 * instances from `drupalSettings.ajax`) then see empty settings. Writing the
 * full merged settings to the element keeps them intact whenever
 * `drupalSettingsLoader.js` runs; the in-memory merge covers the window before
 * it does, and the case where it has already loaded and will not run again.
 *
 * @param json - The backend's merged drupalSettings as a JSON string.
 */
function seedDrupalSettings(json: string): void {
  try {
    const win = window as unknown as { drupalSettings?: Record<string, unknown> }
    const merged = deepMerge(win.drupalSettings ?? {}, JSON.parse(json))
    // ajaxPageState must exist for core's ajax.js: Drupal.Ajax.beforeSerialize()
    // reads drupalSettings.ajaxPageState.{theme,theme_token,libraries} and throws
    // (swallowed by Ajax.execute()) if it is absent, so no request is ever sent.
    // The backend omits it from a CE-rendered form; default it so the first
    // request works, then the AJAX response's own ajaxPageState takes over.
    if (!merged.ajaxPageState) {
      merged.ajaxPageState = { theme: '', theme_token: null, libraries: '' }
    }
    win.drupalSettings = merged
    const selector = 'script[data-drupal-selector="drupal-settings-json"]'
    let el = document.querySelector<HTMLScriptElement>(selector)
    if (!el) {
      el = document.createElement('script')
      el.type = 'application/json'
      el.dataset.drupalSelector = 'drupal-settings-json'
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(merged)
  }
  catch (error) {
    console.error('[drupal-library] invalid drupalSettings', error)
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
 * `drupalSettings` (if any) is seeded synchronously before any script runs (see
 * seedDrupalSettings) — Drupal core JS expects it to exist. Files are appended
 * to the shared queue so they load after earlier requests; when the queue
 * drains, behaviours attach once.
 *
 * @param library - The resolved library (JS files + optional drupalSettings).
 * @param baseUrl - The Drupal backend base URL for resolving root-relative URLs.
 * @returns A promise that settles once this library's files have loaded.
 */
export function loadDrupalLibrary(library: DrupalResolvedLibrary, baseUrl: string): Promise<void> {
  if (library.drupalSettings) {
    seedDrupalSettings(library.drupalSettings)
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
