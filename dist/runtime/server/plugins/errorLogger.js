import { getRequestURL } from "h3";
import { useRuntimeConfig, defineNitroPlugin } from "#imports";
export default defineNitroPlugin((nitro) => {
  const { ceApiEndpoint } = useRuntimeConfig().public.drupalCe;
  const { serverLogLevel } = useRuntimeConfig().drupalCe;
  if (serverLogLevel === "error" || serverLogLevel === "info") {
    nitro.hooks.hook("error", (error, { event }) => {
      const url = getRequestURL(event);
      const fullUrl = url.origin + url.pathname + url.search;
      console.error(`[${event?.node.req.method}] ${fullUrl} - ${error}`);
    });
  }
  if (serverLogLevel === "info") {
    nitro.hooks.hook("request", (event) => {
      const origin = getRequestURL(event).origin;
      console.log(`[${event.node.req.method}] ${origin + event.node.req.url}`);
    });
  }
});
