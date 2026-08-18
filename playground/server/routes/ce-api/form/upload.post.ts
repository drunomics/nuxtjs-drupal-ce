import { defineEventHandler, getQuery, setResponseHeader } from 'h3'

/**
 * Mock backend for a managed_file webform endpoint.
 *
 * On an AJAX form request (?ajax_form=1, as posted by a managed_file
 * upload/remove button) it mimics Drupal: a JSON array of AJAX commands plus the
 * X-Drupal-Ajax-Token verification header that ajax.js checks. Otherwise it
 * behaves like a normal full submit and returns a custom-elements page.
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)

  if (query.ajax_form) {
    setResponseHeader(event, 'X-Drupal-Ajax-Token', '1')
    setResponseHeader(event, 'Content-Type', 'application/json')
    return [
      {
        command: 'insert',
        method: 'replaceWith',
        selector: '#edit-speisekarte-wrapper',
        data: '<div id="edit-speisekarte-wrapper">file uploaded</div>',
      },
    ]
  }

  return {
    title: 'Form response',
    messages: [],
    breadcrumbs: [{ frontpage: true, url: '/', label: 'Home' }],
    metatags: { meta: [], link: [] },
    content_format: 'json',
    content: {
      element: 'node',
      content: '<p>Form response received, submit was successful!</p>',
    },
    page_layout: 'default',
    local_tasks: [],
  }
})
