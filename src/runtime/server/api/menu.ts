import { defineEventHandler, proxyRequest, getRouterParams } from 'h3'
import { getMenuBaseUrl } from '../utils/getBaseUrls'

export default defineEventHandler(async (event) => {
  const menu = getRouterParams(event)._
  return await proxyRequest(event, `${getMenuBaseUrl()}/${menu}`, {
    headers: {
      'Cache-Control': 'max-age=300'
    }
  })
})
