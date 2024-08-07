import { readFormData } from "h3";
import { getDrupalBaseUrl } from "../composables/useDrupalCe/server.js";
import { defineNuxtPlugin, addRouteMiddleware, useRuntimeConfig, useRequestEvent } from "#imports";
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const { ceApiEndpoint } = runtimeConfig.public.drupalCe;
  const drupalBaseUrl = getDrupalBaseUrl();
  addRouteMiddleware("form-handler", async () => {
    if (import.meta.server) {
      const event = useRequestEvent();
      if (event && event.node.req.method === "POST") {
        const formData = await readFormData(event);
        if (formData && formData.get("target_url")) {
          const targetUrl = formData.get("target_url");
          const response = await $fetch.raw(drupalBaseUrl + ceApiEndpoint + targetUrl, {
            method: "POST",
            body: formData
          });
          event.context.nitro.response = {
            _data: response._data,
            headers: Object.fromEntries(response.headers.entries())
          };
        } else {
          throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "The request contains invalid form data or no form data at all."
          });
        }
      }
    }
  }, { global: true });
});
