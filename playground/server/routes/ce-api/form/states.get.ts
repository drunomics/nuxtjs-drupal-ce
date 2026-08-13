/**
 * A form whose conditional field is driven by a Drupal JavaScript library.
 *
 * Mirrors what Drupal emits for a render array with #attached libraries: one
 * <drupal-library-*> element per library, in dependency order, as siblings of
 * the markup, each carrying its resolved JS files. The first one also carries
 * the merged drupalSettings, as a JSON string.
 *
 * The JS files are served by this playground backend from public/core/misc/ as
 * minimal stand-ins for Drupal core's drupal.js and states.js.
 */
export default defineEventHandler(() => ({
  title: 'Conditional form',
  messages: [],
  breadcrumbs: [{ frontpage: true, url: '/', label: 'Home' }],
  metatags: { meta: [], link: [] },
  content_format: 'json',
  content: {
    element: 'drupal-form',
    props: {
      formId: 'states_demo_form',
      attributes: { class: ['states-demo-form'], dataDrupalSelector: 'states-demo-form' },
      method: 'post',
    },
    slots: {
      default: [
        {
          element: 'drupal-library-core-drupal',
          props: {
            library: 'core/drupal',
            js: [{ url: '/core/misc/drupal.js?v=1', attributes: [] }],
            drupalSettings: '{"states_demo":{"greeting":"Hello from drupalSettings"}}',
          },
        },
        {
          element: 'drupal-library-core-drupal-states',
          props: {
            library: 'core/drupal.states',
            js: [{ url: '/core/misc/states.js?v=1', attributes: [] }],
          },
        },
        '<div class="js-form-item form-item">\n <input data-drupal-selector="edit-show-message" type="checkbox" id="edit-show-message" name="show_message" value="1" class="form-checkbox" />\n <label for="edit-show-message" class="form-item__label">Show message field</label>\n</div>\n<div class="js-form-item form-item" data-drupal-selector="edit-message" data-drupal-states="{&quot;visible&quot;:{&quot;:input[name=\\u0022show_message\\u0022]&quot;:{&quot;checked&quot;:true}}}">\n <label for="edit-message" class="form-item__label">Message</label>\n <input type="text" id="edit-message" name="message" value="" size="60" maxlength="255" class="form-text" />\n</div>\n<input class="button--primary button js-form-submit form-submit" data-drupal-selector="edit-submit" type="submit" id="edit-submit" name="op" value="Submit" />\n',
      ],
    },
  },
  page_layout: 'default',
  local_tasks: [],
}))
