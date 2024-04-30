export default defineEventHandler((event) => {
  event.node.res.statusCode = 404
  return { title: 'Seite nicht gefunden', messages: [], breadcrumbs: [], metatags: { meta: [{ name: 'title', content: 'Seite nicht gefunden | lupus decoupled' }], link: [{ rel: 'canonical', href: 'https:\/\/8080-drunomics-lupusdecouple-fd0ilwlpax7.ws-eu86.gitpod.io\/de\/' }, { rel: 'shortlink', href: 'https:\/\/8080-drunomics-lupusdecouple-fd0ilwlpax7.ws-eu86.gitpod.io\/de\/' }] }, content_format: 'json', content: { element: 'drupal-markup', content: 'Die angeforderte Seite konnte nicht gefunden werden.' }, page_layout: 'default', local_tasks: [] }
})
