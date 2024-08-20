import { readFormData, createError } from 'h3'
import { useRuntimeConfig, useRequestEvent } from '#imports'

export default defineNuxtRouteMiddleware(async (from) => {
  if (import.meta.server) {
    const runtimeConfig = useRuntimeConfig()
    const event = useRequestEvent()
    const { ceApiEndpoint } = runtimeConfig.public.drupalCe
    const drupalBaseUrl = getDrupalBaseUrl()

    if (event?.node?.req?.method === 'POST') {
      const formData = await readFormData(event)

      if (formData) {
        const targetUrl = from.fullPath
        const response = await $fetch.raw(drupalBaseUrl + ceApiEndpoint + targetUrl, {
          method: 'POST',
          body: formData,
        })

        event.context.drupalCeCustomPageResponse = {
          _data: response._data,
          headers: Object.fromEntries(response.headers.entries()),
        }
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'The request contains invalid form data or no form data at all.',
        })
      }
    }
  }
})
