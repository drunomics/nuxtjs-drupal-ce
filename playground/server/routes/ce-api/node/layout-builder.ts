export default defineEventHandler(() => ({
  title: 'Layout Builder Test',
  messages: [],
  breadcrumbs: [
    {
      frontpage: true,
      url: '/',
      label: 'Home'
    }
  ],
  content: {
    element: 'node-layout-full',
    type: 'page',
    title: 'Layout Builder Test',
    created: '1734839102',
    sections: [{
      element: 'drupal-layout',
      layout: 'twocol',
      settings: {
        label: 'Two column layout',
        column_widths: '50-50'
      },
      first: {
        element: 'drupal-markup',
        content: '<h2>First Column</h2><p>This is content in the first column of our layout builder test.</p>'
      },
      second: {
        element: 'drupal-markup',
        content: '<h2>Second Column</h2><p>This is content in the second column of our layout builder test.</p>'
      }
    }],
  },
  content_format: 'json',
  local_tasks: {
    primary: [
      {
        url: '/node/layout-builder',
        label: 'View',
        active: true
      }
    ]
  },
  metatags: {
    meta: [
      {
        name: 'title',
        content: 'Layout Builder Test | Drupal CE'
      },
      {
        name: 'description',
        content: 'A test page demonstrating layout builder functionality'
      }
    ],
    link: [
      {
        rel: 'canonical',
        href: 'http://localhost:3000/node/layout-builder'
      }
    ]
  },
  page_layout: 'default'
}))