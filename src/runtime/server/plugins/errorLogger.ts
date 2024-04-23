import { getRequestURL } from 'h3'
import { getDrupalBaseUrl } from '../../composables/useDrupalCe/server'
import { useRuntimeConfig, defineNitroPlugin } from '#imports'

export default defineNitroPlugin((nitro: any) => {
  const { ceApiEndpoint } = useRuntimeConfig().public.drupalCe

  nitro.hooks.hook('error', (error: any, { event }: any) => {
    const url = getRequestURL(event)
    const fullUrl = url.origin + url.pathname + url.search
    console.error(`[${event?.node.req.method}] ${fullUrl} - ${error}`)
  })

  if (nitro.h3App.options.debug) {
    // Log all requests when in debug mode.
    nitro.hooks.hook('render:response', (response: any, { event }: any) => {
      const url = getDrupalBaseUrl() + ceApiEndpoint + event.path
      console.log(`[${response.statusCode}] [${event.node.req.method}] ${url}`)
    })
  }
})
