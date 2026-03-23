/**
 * Sets CORS headers at runtime for component preview requests.
 *
 * Uses beforeResponse to run for ALL requests including static assets,
 * ensuring the runtime drupalBaseUrl is used even when it differs from
 * build-time. Only sets headers when the request origin matches the
 * Drupal backend, so regular requests are unaffected.
 */
declare const _default: any;
export default _default;
