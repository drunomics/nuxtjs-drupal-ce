export default defineEventHandler(async _ => ({
  title: 'Form response',
  messages: [],
  breadcrumbs: [{frontpage: true, url: '\/', label: 'Home'}],
  metatags: {meta: [], link: []},
  content_format: 'json',
  content: {
    element: 'node',
    content: '<p>Form response received, submit was successful!</p>',
  },
  page_layout: 'default',
  local_tasks: [],
}))
