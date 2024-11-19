/**
 * Returns the drupalBaseUrl.
 * On server it returns the serverDrupalBaseUrl if set, otherwise it returns the drupalBaseUrl.
 *
 * @returns {string} Returns the Drupal base URL.
 */
export declare const getDrupalBaseUrl: () => any;
/**
 * Returns the menuBaseUrl if set, otherwise it returns the drupalBaseUrl + ceApiEndpoint.
 *
 * @returns {string} Returns the menu base URL.
 */
export declare const getMenuBaseUrl: () => any;
