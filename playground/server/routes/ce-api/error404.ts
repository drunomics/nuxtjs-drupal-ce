export default defineEventHandler((event) => {
  event.node.res.statusCode = 404
  return {
    title: 'Page not found',
    messages: [],
    breadcrumbs: [],
    metatags: {
      meta: [{ name: 'title', content: 'Page not found | lupus decoupled' }],
      link: [],
    },
    content_format: 'json',
    content: {
      element: 'drupal-markup',
      content: 'The requested page could not be found.',
    },
    page_layout: 'default',
    local_tasks: [],
  }
})
