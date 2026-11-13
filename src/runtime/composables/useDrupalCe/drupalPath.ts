import { useNuxtApp } from '#imports'

/**
 * Returns the Drupal path of a frontend path in the current locale.
 *
 * Frontend route paths are forwarded to Drupal as they are, so the route
 * prefix of the current @nuxtjs/i18n locale is Drupal's language prefix.
 *
 * @param path - Path without leading slash, e.g. `api/menu_items/main`. Empty
 *   for the language prefix alone.
 * @returns The path without leading slash, e.g. `de/api/menu_items/main`. The
 *   given path when @nuxtjs/i18n is not installed.
 */
export const getDrupalPath = (path: string = ''): string => {
  const nuxtApp = useNuxtApp()
  const localized: string = nuxtApp.$i18n ? nuxtApp.$localePath('/' + path) : path
  return localized.startsWith('/') ? localized.substring(1) : localized
}
