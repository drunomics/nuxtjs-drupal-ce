export default defineEventHandler((event) => {
  event.node.res.statusCode = 404
  return { title: 'Page not found', messages: [], breadcrumbs: [], metatags: { meta: [{ name: 'title', content: 'Page not found | lupus decoupled' }], link: [{ rel: 'canonical', href: 'https:\/\/8080-drunomics-lupusdecouple-fd0ilwlpax7.ws-eu86.gitpod.io\/' }, { rel: 'shortlink', href: 'https:\/\/8080-drunomics-lupusdecouple-fd0ilwlpax7.ws-eu86.gitpod.io\/' }] }, content_format: 'json', content: { element: 'drupal-markup', content: 'The requested page could not be found.' }, page_layout: 'default', local_tasks: [] }
})
