/**
 * Fetches page data from Drupal, handles redirects, errors and messages
 * @param path Path of the Drupal page to fetch
 * @param useFetchOptions Optional Nuxt useFetch options
 */
export const useDrupalCeFetchPage = async (path: string, useFetchOptions = {}) => {
  const config = useRuntimeConfig()
  const baseURL = config.public.drupalCe.baseURL

  useFetchOptions.query = useFetchOptions.query ?? {}
  useFetchOptions.query._content_format = useFetchOptions.query._content_format ?? 'json'
  useFetchOptions.key = `page-${path}`
  useFetchOptions.baseURL = baseURL

  const { data: page, error } = await useFetch(path, useFetchOptions)

  if (page?.value?.redirect) {
    await navigateTo(page.value.redirect.url, {
      external: page.value.redirect.external,
      redirectCode: page.value.redirect.statusCode
    })
    return
  }

  if (error.value && !error.value?.data?.content) {
    throw createError({ statusCode: error.value.status, statusMessage: error.value.message, fatal: true })
  }

  if (error.value) {
    page.value = error.value?.data
  }

  page.value?.messages && pushMessagesToState(page.value.messages)

  return page
}

/**
 * Fetches menu data from Drupal, handles errors
 * @param name Menu name being fetched
 */
export const useDrupalCeFetchMenu = async (name: string) => {
  const config = useRuntimeConfig()
  const baseURL = config.public.drupalCe.baseURL
  const menuEndpoint = config.public.drupalCe.menuEndpoint
  const menuPath = menuEndpoint.replace('$$$NAME$$$', name)

  const { data: menu, error } = await useFetch(menuPath, {
    key: `menu-${name}`,
    baseURL
  })

  if (error.value) {
    errorMenuHandler(error)
    return
  }

  return menu
}

/**
 * Use messages state
 */
export const useDrupalCeMessages = () => useState('drupal-ce-messages', () => [])

/**
 * Use page data
 */
export const useDrupalCePage = () => useState(`page-${useRoute().path}`)

/**
 * Render elements from page data returned from useDrupalCeFetchPage
 * @param customElement
 */
export const useDrupalCeRenderCustomElements = (customElement) => {
  return h(resolveComponent(customElement.element), customElement)
}

const pushMessagesToState = (messages) => {
  messages = Object.assign({ success: [], error: [] }, messages)
  const messagesArray = [
    ...messages.error.map(message => ({ type: 'error', message })),
    ...messages.success.map(message => ({ type: 'success', message }))
  ]
  if (!messagesArray.length) {
    return
  }
  process.client && useDrupalCeMessages().value.push(...messagesArray)
}

const errorMenuHandler = (error) => {
  process.client && useDrupalCeMessages().value.push({
    type: 'error',
    message: `Menu error: ${error.value.message}.`
  })
}
