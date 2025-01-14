import { eventHandler, getRequestURL, setResponseStatus } from 'h3'
// Catch-all handler for  /ce-api/* paths - avoids 404 endless loops.

export default eventHandler((event) => {
  const url = getRequestURL(event)
  setResponseStatus(event, 404)
  return {
    title: 'Not found',
    messages: [],
    breadcrumbs: [],
    metatags: {
      meta: [
        { name: 'title', content: 'Not found' }
      ],
      link: []
    },
    content_format: 'json',
    content: {
      element: 'drupal-markup',
      content: `API endpoint ${url.pathname} not found.`
    },
    page_layout: 'default',
    local_tasks: []
  }
})
