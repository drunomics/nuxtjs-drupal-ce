export default defineEventHandler(async (event) => {
  const drupalCe = useRuntimeConfig().public.drupalCe
  const menuBaseUrl = drupalCe.serverDrupalBaseUrl || drupalCe.menuBaseUrl
  const menu = event.context.params._
  return await proxyRequest(event, `${menuBaseUrl}/${menu}`, {
    headers: {
      'Cache-Control': 'max-age=300'
    }
  })
});
