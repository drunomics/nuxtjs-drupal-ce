import { vDrupalMarkup } from '../directives/drupalMarkup'
import { defineNuxtPlugin } from '#imports'

/**
 * Registers `v-drupal-markup` app-wide so components rendering Drupal markup can
 * use it in their templates - see the directive for what it solves.
 */
export default defineNuxtPlugin({
  name: 'drupal-ce:drupal-markup',
  setup(nuxtApp) {
    nuxtApp.vueApp.directive('drupal-markup', vDrupalMarkup)
  },
})
