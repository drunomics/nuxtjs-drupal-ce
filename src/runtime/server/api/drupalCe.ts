import { defineEventHandler, proxyRequest, getRouterParams } from 'h3'
import { getDrupalBaseUrl } from '../utils/getBaseUrls'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)._
  const path = params ? '/' + params : ''
  const drupalBaseUrl = getDrupalBaseUrl()
  const { ceApiEndpoint } = useRuntimeConfig().public.drupalCe
  // Remove x-forwarded-proto header as it causes issues with the request.
  delete event.req.headers['x-forwarded-proto']
  return await proxyRequest(event, drupalBaseUrl + ceApiEndpoint + path)
})
