import { defineEventHandler, proxyRequest, getRouterParams } from "h3";
import { getMenuBaseUrl } from "../../composables/useBaseUrls.mjs";
export default defineEventHandler(async (event) => {
  const menu = getRouterParams(event)._;
  return await proxyRequest(event, `${getMenuBaseUrl()}/${menu}`, {
    headers: {
      "Cache-Control": "max-age=300"
    }
  });
});
