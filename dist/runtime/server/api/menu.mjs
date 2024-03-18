import { defineEventHandler, proxyRequest, getRouterParams } from "h3";
import { getMenuBaseUrl } from "../utils/getBaseUrls.mjs";
export default defineEventHandler(async (event) => {
  const menuBaseUrl = getMenuBaseUrl();
  const menu = getRouterParams(event)._;
  return await proxyRequest(event, `${menuBaseUrl}/${menu}`, {
    headers: {
      "Cache-Control": "max-age=300"
    }
  });
});
