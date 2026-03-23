import { setResponseHeader, getRequestHeader } from "h3";
import { defineNitroPlugin, useRuntimeConfig } from "#imports";
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    const drupalBaseUrl = useRuntimeConfig().public.drupalCe?.drupalBaseUrl;
    if (!drupalBaseUrl) {
      return;
    }
    let corsOrigin;
    try {
      corsOrigin = new URL(drupalBaseUrl).origin;
    } catch {
      return;
    }
    const origin = getRequestHeader(event, "origin");
    if (!origin || origin !== corsOrigin) {
      return;
    }
    setResponseHeader(event, "Access-Control-Allow-Origin", corsOrigin);
    setResponseHeader(event, "Access-Control-Allow-Methods", "GET");
    setResponseHeader(event, "Access-Control-Allow-Credentials", "true");
  });
});
