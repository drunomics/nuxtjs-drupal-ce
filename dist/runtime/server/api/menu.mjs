import { defineEventHandler, proxyRequest, getRouterParams } from "h3";
import { getMenuBaseUrl } from "../../composables/useDrupalCe/server.mjs";
export default defineEventHandler(async (event) => {
  const menuPath = getRouterParams(event)._;
  return await proxyRequest(event, `${getMenuBaseUrl()}/${menuPath}`, {
    headers: {
      "Cache-Control": "max-age=300"
    }
  });
});
