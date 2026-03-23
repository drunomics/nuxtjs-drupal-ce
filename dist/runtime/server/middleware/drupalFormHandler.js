import { defineEventHandler, readFormData } from "h3";
import { getDrupalBaseUrl } from "../../composables/useDrupalCe/server.js";
import { useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const { disableFormHandler } = useRuntimeConfig().drupalCe;
  const { ceApiEndpoint, fetchProxyHeaders } = useRuntimeConfig().public.drupalCe;
  const currentPath = event.node.req.url?.split("?")[0] || "";
  if (currentPath.startsWith("/api/drupal-ce/") || currentPath === "/api/drupal-ce") {
    return;
  }
  if (event.node.req.method === "POST") {
    const routesToBypass = Array.isArray(disableFormHandler) ? disableFormHandler : [];
    if (routesToBypass.length) {
      const currentPath2 = event.node.req.url?.split("?")[0] || "";
      const shouldBypass = routesToBypass.some((route) => {
        const routeFormats = [
          route,
          "/api/drupal-ce" + route,
          ceApiEndpoint + route
        ];
        return routeFormats.some((format) => format === currentPath2);
      });
      if (shouldBypass) {
        return;
      }
    }
    const contentType = event.node.req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded") || event.node.req.headers["x-form-processed"]) {
      return;
    }
    const formData = await readFormData(event);
    if (formData) {
      const targetUrl = event.node.req.url;
      const proxyHeaders = {};
      if (Array.isArray(fetchProxyHeaders)) {
        for (const name of fetchProxyHeaders) {
          const value = event.node.req.headers[name.toLowerCase()];
          if (value) {
            proxyHeaders[name.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value;
          }
        }
      }
      const response = await $fetch.raw(getDrupalBaseUrl() + ceApiEndpoint + targetUrl, {
        method: "POST",
        body: formData,
        headers: {
          ...proxyHeaders,
          "x-form-processed": "true"
        }
      }).catch((error) => {
        event.context.drupalCeCustomPageResponse = {
          error: {
            data: error,
            statusCode: error.statusCode || 400,
            message: error.message || "Error when POSTing form data (drupalFormHandler)."
          }
        };
      });
      if (response) {
        event.context.drupalCeCustomPageResponse = {
          _data: response._data,
          headers: Object.fromEntries(response.headers.entries())
        };
      }
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "POST requests without form data are not supported (drupalFormHandler)."
      });
    }
  }
});
