import { defineEventHandler, proxyRequest } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const { serverDrupalBaseUrl, drupalBaseUrl, menuBaseUrl, ceApiEndpoint } = useRuntimeConfig().public.drupalCe
  const menuUrl = menuBaseUrl || (serverDrupalBaseUrl || drupalBaseUrl) + ceApiEndpoint
  const menu = event.context.params._
  return await proxyRequest(event, `${menuUrl}/${menu}`, {
    headers: {
      'Cache-Control': 'max-age=300'
    }
  })
})
