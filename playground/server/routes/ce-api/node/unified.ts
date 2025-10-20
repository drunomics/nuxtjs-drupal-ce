export default defineEventHandler(() => ({
  title: 'Another page',
  messages: [],
  breadcrumbs: [],
  metatags: {},
  content_format: 'json',
  content: {
    element: 'node',
    slots: {
      image: '<img loading="lazy" src="https://placehold.co/600x400" width="600" height="400" alt="test" />',
      body: {
        element: 'node',
        slots: {
          body: '<p>2nd <b>example</b> body.</p>',
        },
        props: {
          title: 'Title2',
        },
      },
    },
    props: {
      title: 'Title',
    },
  },
  page_layout: 'clear',
  local_tasks: [],
}))
