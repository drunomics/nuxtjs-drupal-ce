import { defineEventHandler, proxyRequest } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const path = `/${event.context.params._.replace('api/drupal-ce', '')}`
  const drupalCe = useRuntimeConfig().public.drupalCe
  const drupalUrl = (drupalCe.serverDrupalBaseUrl || drupalCe.drupalBaseUrl) + drupalCe.ceApiEndpoint
  return await proxyRequest(event, drupalUrl + path)
})
