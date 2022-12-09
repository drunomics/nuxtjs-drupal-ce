import { h } from 'vue'
import { useRuntimeConfig, useAsyncData, resolveComponent, navigateTo, createError } from '#imports'

export const useDrupalCeFetchPage = async (path: string) => {
  const config = useRuntimeConfig()
  const baseURL = config.public.drupalCe.baseURL

  const { data: page } = await useAsyncData(
    'page',
    () => $fetch(path, {
      baseURL,
      query: {
        _content_format: 'json'
      },
      onResponseError ({ request, response }) {
        throw createError({ statusCode: response.status, statusMessage: response.data })
      }
    })
  )

  if (page?.value?.redirect) {
    await navigateTo(page.value.redirect.url, {
      external: page.value.redirect.external,
      redirectCode: page.value.redirect.statusCode
    })
  }

  return page
}

export const useDrupalCeFetchMenu = async (name: string) => {
  const config = useRuntimeConfig()
  const baseURL = config.public.drupalCe.baseURL
  const menuEndpoint = config.public.drupalCe.menuEndpoint
  const menuPath = menuEndpoint.replace('$$$NAME$$$', name)

  const { data: menu } = await useAsyncData(
    'menu-' + name,
    () => $fetch(menuPath, {
      baseURL,
      onResponseError ({ request, response }) {
        throw createError({ statusCode: response.status, statusMessage: response.data })
      }
    })
  )

  return menu
}

export const useRenderCustomElements = (customElement) => {
  return h(resolveComponent(customElement.element), customElement)
}
