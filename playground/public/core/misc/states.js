/**
 * Minimal stand-in for Drupal core's states.js, for the playground demo.
 *
 * Implements only the "visible when a checkbox is checked" condition, which is
 * enough to show a Drupal library driving server-rendered markup in the
 * decoupled frontend. Core resolves the full #states grammar and its jQuery
 * selectors; here the `:input` prefix is dropped to get a plain CSS selector.
 */
window.Drupal.behaviors.states = {
  attach(context) {
    context.querySelectorAll('[data-drupal-states]').forEach((element) => {
      const condition = JSON.parse(element.dataset.drupalStates).visible
      const selector = Object.keys(condition)[0]
      const input = document.querySelector(selector.replace(':input', ''))
      if (!input || input.dataset.statesBound) {
        return
      }
      input.dataset.statesBound = 'true'
      const update = () => {
        element.hidden = input.checked !== condition[selector].checked
      }
      input.addEventListener('change', update)
      update()
    })
  },
}
