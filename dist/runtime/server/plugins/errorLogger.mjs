import { getRequestURL } from "h3";
import { getDrupalBaseUrl } from "../../composables/useDrupalCe/server.mjs";
import { useRuntimeConfig, defineNitroPlugin } from "#imports";
export default defineNitroPlugin((nitro) => {
  const { ceApiEndpoint } = useRuntimeConfig().public.drupalCe;
  nitro.hooks.hook("error", (error, { event }) => {
    const url = getRequestURL(event);
    const fullUrl = url.origin + url.pathname + url.search;
    console.error(`[${event?.node.req.method}] ${fullUrl} - ${error}`);
  });
  if (nitro.h3App.options.debug) {
    nitro.hooks.hook("render:response", (response, { event }) => {
      const url = getDrupalBaseUrl() + ceApiEndpoint + event.path;
      console.log(`[${response.statusCode}] [${event.node.req.method}] ${url}`);
    });
  }
});
