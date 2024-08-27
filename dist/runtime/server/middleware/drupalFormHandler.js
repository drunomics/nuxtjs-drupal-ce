import { defineEventHandler, readFormData } from "h3";
import { getDrupalBaseUrl } from "../../composables/useDrupalCe/server.js";
import { useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const { ceApiEndpoint } = useRuntimeConfig().public.drupalCe;
  if (event.node.req.method === "POST") {
    const formData = await readFormData(event);
    if (formData) {
      const targetUrl = event.node.req.url;
      const response = await $fetch.raw(getDrupalBaseUrl() + ceApiEndpoint + targetUrl, {
        method: "POST",
        body: formData
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
