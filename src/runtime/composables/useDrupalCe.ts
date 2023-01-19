import { h } from 'vue'
import {
  useRuntimeConfig,
  resolveComponent,
  createError,
  useFetch,
  navigateTo
} from '#imports'

export const useDrupalCeFetchPage = async (path: string) => {
  const config = useRuntimeConfig()
  const baseURL = config.public.drupalCe.baseURL

  const { data: page, error } = await useFetch(path, {
    key: `page-${path}`,
    baseURL,
    query: {
      _content_format: 'json'
    }
  })

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

  return error.value ? error.value?.data : page
}

export const useDrupalCeFetchMenu = async (name: string) => {
  const config = useRuntimeConfig()
  const baseURL = config.public.drupalCe.baseURL
  const menuEndpoint = config.public.drupalCe.menuEndpoint
  const menuPath = menuEndpoint.replace('$$$NAME$$$', name)

  const { data: menu } = await useFetch(menuPath, {
    key: `menu-${name}`,
    baseURL
  })

  return menu
}

export const useDrupalCeRenderCustomElements = (customElement) => {
  return h(resolveComponent(customElement.element), customElement)
}
