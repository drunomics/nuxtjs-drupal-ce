import { useRuntimeConfig } from '#imports'

export const getDrupalBaseUrl = () => {
  return useRuntimeConfig().public.drupalCe.drupalBaseUrl
}

export const getMenuBaseUrl = () => {
  const config = useRuntimeConfig().public.drupalCe
  return config.menuBaseUrl ? config.menuBaseUrl : getDrupalBaseUrl() + config.ceApiEndpoint
}
