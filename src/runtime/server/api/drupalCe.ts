import { defineEventHandler, proxyRequest, getRouterParams } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)._
  // Params wrongly contain the api prefix on root path, so we need to remove it.
  const path = '/' + (params === 'api/drupal-ce' ? '' : params)
  const drupalCe = useRuntimeConfig().public.drupalCe
  const drupalUrl = (drupalCe.serverDrupalBaseUrl || drupalCe.drupalBaseUrl) + drupalCe.ceApiEndpoint
  return await proxyRequest(event, drupalUrl + path)
})
