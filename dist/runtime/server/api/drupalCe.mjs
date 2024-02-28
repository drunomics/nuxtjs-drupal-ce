import { defineEventHandler, proxyRequest, getRouterParams } from "h3";
import { useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)._;
  const path = params ? "/" + params : "";
  const drupalCe = useRuntimeConfig().public.drupalCe;
  const drupalUrl = (drupalCe.serverDrupalBaseUrl || drupalCe.drupalBaseUrl) + drupalCe.ceApiEndpoint;
  delete event.req.headers["x-forwarded-proto"];
  return await proxyRequest(event, drupalUrl + path);
});
