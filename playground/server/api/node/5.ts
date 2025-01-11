// This file is only there for manual testing and NOT used in actual test cases.
export default defineEventHandler(() => {
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
