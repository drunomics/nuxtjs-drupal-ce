export default defineEventHandler(async (event) => {
  const menuBaseUrl = useRuntimeConfig().public.drupalCe.menuBaseUrl
  const menu = event.context.params._
  return await proxyRequest(event, `${menuBaseUrl}/${menu}`, {
    headers: {
      'Cache-Control': 'max-age=300'
    }
  })
});
