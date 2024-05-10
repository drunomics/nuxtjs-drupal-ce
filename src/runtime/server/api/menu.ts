import { defineEventHandler, proxyRequest, getRouterParams } from 'h3'
import { getMenuBaseUrl } from '../../composables/useDrupalCe/server'

export default defineEventHandler(async (event) => {
  // Get the menu path along with the localization prefix.
  const menuPath = getRouterParams(event)._
  return await proxyRequest(event, `${getMenuBaseUrl()}/${menuPath}`, {
    headers: {
      'Cache-Control': 'max-age=300',
    },
  })
})
