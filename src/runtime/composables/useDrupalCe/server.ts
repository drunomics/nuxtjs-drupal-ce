import { useRuntimeConfig } from '#imports'

export const getDrupalBaseUrl = () => {
  const config = useRuntimeConfig().public.drupalCe
  return import.meta.server && config.serverDrupalBaseUrl ? config.serverDrupalBaseUrl : config.drupalBaseUrl
}

export const getMenuBaseUrl = () => {
  const config = useRuntimeConfig().public.drupalCe
  return config.menuBaseUrl ? config.menuBaseUrl : getDrupalBaseUrl() + config.ceApiEndpoint
}
