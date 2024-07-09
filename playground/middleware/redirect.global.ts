export default defineNuxtRouteMiddleware((to, from) => {
  const config = useRuntimeConfig().public.drupalCe

  switch (true) {
    case /^\/((en|de)\/)?user.*$/.test(to.path):
    case /^\/((en|de)\/)?admin.*$/.test(to.path):
    case /^\/((en|de)\/)?(node\/(add|[^/]+\/(edit|delete|revisions|translations))|entity_clone\/node\/[^/]+)/.test(
      to.path,
    ):
    case /^\/((en|de)\/)?node\/[^/]+\/layout$/.test(to.path):
      return navigateTo(`${config.drupalBaseUrl}${to.fullPath}`, {
        external: true,
        redirectCode: 301,
      })
  }
})
