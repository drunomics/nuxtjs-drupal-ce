// This file is only there for manual testing AND used in e2e test cases.
// This is for testing the /preview/* route via /preview/node.
export default defineEventHandler(async (event) => {
  setHeaders(event, {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': true,
  })
  return {
    breadcrumbs: [
      {
        frontpage: true,
        url: '/',
        label: 'Home'
      }
    ],
    content: {
      element: 'node-article',
      created: '1734839102',
      title: 'Test article',
      body: '<p>Some <b>example</b> body.</p>',
      comment: {},
      image: '  <img loading="lazy" src="https://placehold.co/600x400" width="600" height="400" alt="test" />\n\n\n'
    },
    content_format: 'json',
    local_tasks: {},
    messages: [],
    metatags: {
      meta: [
        {
          name: 'title',
          content: 'tes adfa fdfdsf | Drush Site-Install'
        },
        {
          name: 'description',
          content: 'asdf asdfasdf'
        }
      ],
      link: [
        {
          rel: 'canonical',
          href: 'https://lupus-nuxt.ddev.site/custom-error'
        }
      ]
    },
    page_layout: 'default',
    title: 'tes adfa fdfdsf'
  }
})
