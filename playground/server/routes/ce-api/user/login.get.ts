export default defineEventHandler(async _ => ({
  title: 'Log in',
  messages: [],
  breadcrumbs: [{frontpage: true, url: '\/', label: 'Home'}],
  metatags: {meta: [], link: []},
  content_format: 'json',
  content: {
    element: 'drupal-form',
    formId: 'user_login_form',
    attributes: {class: ['user-login-form'], dataDrupalSelector: 'user-login-form'},
    method: 'post',
    content: '<div class="js-form-item form-item js-form-type-textfield form-item-name js-form-item-name">\n <label for="edit-name" class="form-item__label js-form-required form-required">Username</label>\n <input autocorrect="none" autocapitalize="none" spellcheck="false" autofocus="autofocus" autocomplete="username" data-drupal-selector="edit-name" type="text" id="edit-name" name="name" value="" size="60" maxlength="60" class="form-text required form-element form-element--type-text form-element--api-textfield" required="required" aria-required="true">\n\n </div>\n<div class="js-form-item form-item js-form-type-password form-item-pass js-form-item-pass">\n <label for="edit-pass" class="form-item__label js-form-required form-required">Password</label>\n <input autocomplete="current-password" data-drupal-selector="edit-pass" type="password" id="edit-pass" name="pass" size="60" maxlength="128" class="form-text required form-element form-element--type-password form-element--api-password" required="required" aria-required="true">\n\n </div>\n<input data-drupal-selector="form-6ngyrvfrmgfogyhp4piezpfq5nj09qszrlhrch4nvzi" type="hidden" name="form_build_id" value="form-6NGYrVfrmgfoGYHP4piEzpFq5Nj09QszRLhRCH4NvZI">\n<input data-drupal-selector="edit-user-login-form" type="hidden" name="form_id" value="user_login_form">\n<div data-drupal-selector="edit-actions" class="form-actions js-form-wrapper form-wrapper" id="edit-actions"><input class="button--primary button js-form-submit form-submit" data-drupal-selector="edit-submit" type="submit" id="edit-submit" name="op" value="Log in">\n</div>\n'  },
  page_layout: 'default',
  local_tasks: [],
}))
