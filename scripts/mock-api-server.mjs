/**
 * Simple mock API server for prerender testing.
 * Returns static JSON responses for node/1 and node/3.
 */
import { createServer } from 'node:http'

const PORT = process.env.PORT || 3010

const responses = {
  '/ce-api/node/1': {
    title: 'Test page',
    messages: [],
    breadcrumbs: [],
    metatags: {
      meta: [{ name: 'title', content: 'Test page | lupus decoupled' }],
      link: []
    },
    content_format: 'json',
    content: {
      element: 'node',
      type: 'page',
      title: 'Test page',
      body: '<p>Content for test page.</p>'
    },
    page_layout: 'default',
    local_tasks: { primary: [], secondary: [] }
  },
  '/ce-api/node/3': {
    title: 'Another page',
    messages: [],
    breadcrumbs: [],
    metatags: {
      meta: [{ name: 'title', content: 'Another page | lupus decoupled' }],
      link: []
    },
    content_format: 'json',
    content: {
      element: 'node',
      type: 'page',
      title: 'Another page',
      body: '<p>Content for another page.</p>'
    },
    page_layout: 'default',
    local_tasks: { primary: [], secondary: [] }
  }
}

const server = createServer((req, res) => {
  console.log(`[mock-api] ${req.method} ${req.url}`)

  const response = responses[req.url]
  if (response) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response))
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock-api] Server listening on http://127.0.0.1:${PORT}`)
})
