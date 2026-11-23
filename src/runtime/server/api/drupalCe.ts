import { defineEventHandler, proxyRequest, getRouterParams, getRequestURL } from 'h3'
import { getDrupalBaseUrl } from '../../composables/useDrupalCe/server'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)._
  const path = params ? '/' + params : ''
  // The query string as received: repeated keys (`a[]=1&a[]=2`) stay apart.
  const query = getRequestURL(event).search
  const { ceApiEndpoint } = useRuntimeConfig().public.drupalCe
  // Remove x-forwarded-proto header as it causes issues with the request.
  delete event.req.headers['x-forwarded-proto']
  return await proxyRequest(event, getDrupalBaseUrl() + ceApiEndpoint + path + query)
})
