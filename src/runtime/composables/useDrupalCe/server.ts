import { useRuntimeConfig } from '#imports'

/**
 * Returns the drupalBaseUrl.
 * On server it returns the serverDrupalBaseUrl if set, otherwise it returns the drupalBaseUrl.
 *
 * @returns {string} Returns the Drupal base URL.
 */
export const getDrupalBaseUrl = () => {
  const config = useRuntimeConfig().public.drupalCe
  return import.meta.server && config.serverDrupalBaseUrl ? config.serverDrupalBaseUrl : config.drupalBaseUrl
}

/**
 * Returns the menuBaseUrl if set, otherwise it returns the drupalBaseUrl + ceApiEndpoint.
 *
 * @returns {string} Returns the menu base URL.
 */
export const getMenuBaseUrl = () => {
  const config = useRuntimeConfig().public.drupalCe
  return config.menuBaseUrl ? config.menuBaseUrl : getDrupalBaseUrl() + config.ceApiEndpoint
}

/**
 * Converts a Headers object to a plain record, keeping multiple Set-Cookie
 * values as an array under the 'set-cookie' key.
 */
export const headersToRecord = (headers: Headers): Record<string, string | string[]> => {
  const record: Record<string, string | string[]> = Object.fromEntries(headers.entries())
  const setCookies = headers.getSetCookie()
  if (setCookies.length > 1) {
    record['set-cookie'] = setCookies
  }
  return record
}
