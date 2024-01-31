import { defineEventHandler, proxyRequest, getRouterParams } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const drupalCe = useRuntimeConfig().public.drupalCe
  const { serverDrupalBaseUrl, drupalBaseUrl, menuBaseUrl: ceMenuBaseUrl, ceApiEndpoint } = drupalCe
  const menuBaseUrl = ceMenuBaseUrl || (serverDrupalBaseUrl || drupalBaseUrl) + ceApiEndpoint
  const menu = getRouterParams(event)._
  return await proxyRequest(event, `${menuBaseUrl}/${menu}`, {
    headers: {
      'Cache-Control': 'max-age=300'
    }
  })
})
