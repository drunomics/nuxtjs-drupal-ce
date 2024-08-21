export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const { ceApiEndpoint, drupalBaseUrl, serverDrupalBaseUrl } = runtimeConfig.public.drupalCe
  const fetchUrl = serverDrupalBaseUrl ? serverDrupalBaseUrl : drupalBaseUrl

  if (event.node.req.method === 'POST') {
    const formData = await readFormData(event)

    if (formData) {
      const targetUrl = event.node.req.url
      const response = await $fetch.raw(fetchUrl + ceApiEndpoint + targetUrl, {
        method: 'POST',
        body: formData,
      }).catch((error) => {
        event.context.drupalCeCustomPageResponse = {
          error: {
            data: error,
            statusCode: error.statusCode || 400,
            message: error.message || 'Fetch error. See drupalFormHandler.',
          }
        }
      })

      if (response) {
        event.context.drupalCeCustomPageResponse = {
          _data: response._data,
          headers: Object.fromEntries(response.headers.entries()),
        }
        return
      }
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'No or invalid form data given. See drupalFormHandler.',
      })
    }
  }
})