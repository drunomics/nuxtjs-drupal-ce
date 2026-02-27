export default defineEventHandler(async (event) => {
  const receivedCookie = getRequestHeader(event, 'cookie') || ''
  return {
    title: 'Form response',
    messages: [],
    breadcrumbs: [{frontpage: true, url: '\/', label: 'Home'}],
    metatags: {meta: [], link: []},
    content_format: 'json',
    content: {
      element: 'node',
      content: `<p>Form response received, submit was successful!</p><p data-received-cookie="${receivedCookie}"></p>`,
    },
    page_layout: 'default',
    local_tasks: [],
  }
})
