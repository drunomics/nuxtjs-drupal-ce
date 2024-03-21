import { useRuntimeConfig } from "#imports";
export const getDrupalBaseUrl = () => {
  const config = useRuntimeConfig().public.drupalCe;
  return config.serverDrupalBaseUrl ? config.serverDrupalBaseUrl : config.drupalBaseUrl;
};
export const getMenuBaseUrl = () => {
  const config = useRuntimeConfig().public.drupalCe;
  return config.menuBaseUrl ? config.menuBaseUrl : config.drupalBaseUrl + config.ceApiEndpoint;
};
