export default defineEventHandler(async (event) => {
  const menuBaseUrl = useRuntimeConfig().public.drupalCe.menuBaseUrl
  let menuEndpoint = useRuntimeConfig().public.drupalCe.menuEndpoint
  const menuName = event.context.params._
  menuEndpoint = menuEndpoint.replace('$$$NAME$$$', menuName)
  return await proxyRequest(event, `${menuBaseUrl}/${menuEndpoint}`, {
    headers: {
      'Cache-Control': 'max-age=300',
    }
  })
});
