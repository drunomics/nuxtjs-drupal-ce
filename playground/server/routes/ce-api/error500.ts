export default defineEventHandler((event) => {
  event.node.res.statusCode = 500
  return {
    title: 'Internal Server Error',
    messages: [],
    breadcrumbs: [],
    metatags: {
      meta: [{ name: 'title', content: 'Internal Server Error | lupus decoupled' }],
      link: [],
    },
    content_format: 'json',
    content: {
      element: 'drupal-markup',
      content: 'An internal server error occurred.',
    },
    page_layout: 'default',
    local_tasks: [],
  }
})
