/**
 * Minimal stand-in for Drupal core's drupal.js, for the playground demo.
 *
 * Provides just enough of the global Drupal object for a library to register a
 * behavior and for the loader to run Drupal.attachBehaviors() once the library
 * has loaded. Loaded first because states.js builds on it — the order the
 * backend resolved and the loader preserves.
 */
window.Drupal = window.Drupal || { behaviors: {} }

window.Drupal.attachBehaviors = function (context, settings) {
  context = context || document
  settings = settings || window.drupalSettings
  Object.keys(window.Drupal.behaviors).forEach(function (id) {
    const behavior = window.Drupal.behaviors[id]
    if (typeof behavior.attach === 'function') {
      behavior.attach(context, settings)
    }
  })
}
