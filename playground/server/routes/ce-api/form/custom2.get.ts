export default defineEventHandler(async _ => ({
  title: 'Custom form 2',
  messages: [],
  breadcrumbs: [{frontpage: true, url: '\/', label: 'Home'}],
  metatags: {meta: [], link: []},
  content_format: 'json',
  content: {
    element: 'drupal-form',
    props: {
      formId: 'custom_form_2',
      attributes: {class: ['custom-form'], dataDrupalSelector: 'custom-form'},
      method: 'post',
    },
    slots: {
      default: '<div class="js-form-item form-item">\n <label for="edit-name" class="form-item__label">Username</label>\n <input autocorrect="none" autocapitalize="none" spellcheck="false" autofocus="autofocus" autocomplete="username" data-drupal-selector="edit-name" type="text" id="edit-name" name="name" value="" size="60" maxlength="60" class="form-text required" required="required" aria-required="true" />\n\n </div><input class="button--primary button js-form-submit form-submit" data-drupal-selector="edit-submit" type="submit" id="edit-submit" name="op" value="Submit" />\n</div>\n',
    },
  },
  page_layout: 'default',
  local_tasks: [],
}))
