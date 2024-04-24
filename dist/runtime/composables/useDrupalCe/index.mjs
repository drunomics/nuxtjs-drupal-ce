import { callWithNuxt } from "#app";
import { defu } from "defu";
import { appendResponseHeader } from "h3";
import { getDrupalBaseUrl, getMenuBaseUrl } from "./server.mjs";
import { useRuntimeConfig, useState, useFetch, navigateTo, createError, h, resolveComponent, setResponseStatus, useNuxtApp, useRequestHeaders, ref, watch } from "#imports";
export const useDrupalCe = () => {
  const config = useRuntimeConfig().public.drupalCe;
  const processFetchOptions = (fetchOptions = {}) => {
    if (config.serverApiProxy) {
      fetchOptions.baseURL = "/api/drupal-ce";
    } else {
      fetchOptions.baseURL = fetchOptions.baseURL ?? getDrupalBaseUrl() + config.ceApiEndpoint;
    }
    fetchOptions = defu(fetchOptions, config.fetchOptions);
    if (config.fetchProxyHeaders) {
      fetchOptions.headers = defu(fetchOptions.headers ?? {}, useRequestHeaders(config.fetchProxyHeaders));
    }
    fetchOptions.query = fetchOptions.query ?? {};
    fetchOptions.query._content_format = fetchOptions.query._content_format ?? config.addRequestContentFormat;
    if (!fetchOptions.query._content_format) {
      delete fetchOptions.query._content_format;
    }
    if (config.addRequestFormat) {
      fetchOptions.query._format = "custom_elements";
    }
    return fetchOptions;
  };
  const $ceApi = (fetchOptions = {}) => {
    const useFetchOptions = processFetchOptions(fetchOptions);
    useFetchOptions.onResponseError = ({ response }) => {
      const statusCode = response.statusCode || response.status;
      const message = response._data.message ? `${response._data.url} - ${response._data.message}` : "The website encountered an unexpected error. Please try again later.";
      if (statusCode === 500) {
        const error = ref({
          statusCode,
          message: `[${statusCode}] ${message}`,
          data: response._data
        });
        return pageErrorHandler(error);
      }
    };
    return $fetch.create({
      ...useFetchOptions
    });
  };
  const useCeApi = (path, fetchOptions = {}, doPassThroughHeaders) => {
    const nuxtApp = useNuxtApp();
    fetchOptions.onResponse = (context) => {
      if (doPassThroughHeaders && config.passThroughHeaders && import.meta.server) {
        const headersObject = Object.fromEntries([...context.response.headers.entries()]);
        passThroughHeaders(nuxtApp, headersObject);
      }
    };
    return useFetch(path, {
      ...fetchOptions,
      $fetch: $ceApi(fetchOptions)
    });
  };
  const getCeApiEndpoint = (localize = true) => {
    const nuxtApp = useNuxtApp();
    if (localize && nuxtApp.$i18n?.locale && nuxtApp.$i18n.locale.value !== nuxtApp.$i18n.defaultLocale) {
      return `${config.ceApiEndpoint}/${nuxtApp.$i18n.locale.value}`;
    }
    return config.ceApiEndpoint;
  };
  const fetchPage = async (path, useFetchOptions = {}, overrideErrorHandler) => {
    const nuxtApp = useNuxtApp();
    const pageState = useState("drupal-ce-page-data", () => ({
      breadcrumbs: [],
      content: {},
      content_format: "json",
      local_tasks: {
        primary: [],
        secondary: []
      },
      settings: {},
      messages: [],
      metatags: {
        meta: [],
        link: [],
        jsonld: []
      },
      page_layout: "default",
      title: ""
    }));
    useFetchOptions.key = `page-${path}`;
    const { data: page, error } = await useCeApi(path, useFetchOptions, true);
    if (page?.value?.redirect) {
      await callWithNuxt(nuxtApp, navigateTo, [
        page.value.redirect.url,
        { external: page.value.redirect.external, redirectCode: page.value.redirect.statusCode, replace: true }
      ]);
      return pageState;
    }
    if (error.value) {
      overrideErrorHandler ? overrideErrorHandler(error) : pageErrorHandler(error, { config, nuxtApp });
      page.value = error.value?.data;
    }
    page.value?.messages && pushMessagesToState(page.value.messages);
    pageState.value = page;
    return page;
  };
  const fetchMenu = async (name, useFetchOptions = {}, overrideErrorHandler) => {
    const nuxtApp = useNuxtApp();
    useFetchOptions = processFetchOptions(useFetchOptions);
    useFetchOptions.key = `menu-${name}`;
    useFetchOptions.getCachedData = (key) => {
      if (nuxtApp.payload.data[key]) {
        return nuxtApp.payload.data[key];
      }
    };
    const baseMenuPath = config.menuEndpoint.replace("$$$NAME$$$", name);
    const menuPath = ref(baseMenuPath);
    if (config.useLocalizedMenuEndpoint && nuxtApp.$i18n) {
      menuPath.value = nuxtApp.$localePath("/" + baseMenuPath);
      watch(nuxtApp.$i18n.locale, () => {
        let menuLocalePath = nuxtApp.$localePath("/" + baseMenuPath);
        if (config.serverApiProxy && menuLocalePath.startsWith("/")) {
          menuLocalePath = menuLocalePath.substring(1);
        }
        menuPath.value = menuLocalePath;
      });
    }
    if (config.serverApiProxy) {
      useFetchOptions.baseURL = "/api/menu";
      if (menuPath.value.startsWith("/")) {
        menuPath.value = menuPath.value.substring(1);
      }
    }
    const { data: menu, error } = await useCeApi(menuPath, useFetchOptions);
    if (error.value) {
      overrideErrorHandler ? overrideErrorHandler(error) : menuErrorHandler(error);
    }
    return menu;
  };
  const getMessages = () => useState("drupal-ce-messages", () => []);
  const getPage = () => useState("drupal-ce-page-data", () => ({}));
  const renderCustomElements = (customElements) => {
    if (Object.keys(customElements).length === 0) {
      return;
    }
    return Array.isArray(customElements) ? h("div", customElements.map((customElement) => h(resolveComponent(customElement.element), customElement))) : h(resolveComponent(customElements.element), customElements);
  };
  const passThroughHeaders = (nuxtApp, pageHeaders) => {
    if (!nuxtApp.ssrContext) {
      return;
    }
    const event = nuxtApp.ssrContext.event;
    if (pageHeaders) {
      Object.keys(pageHeaders).forEach((key) => {
        if (config.passThroughHeaders.includes(key)) {
          appendResponseHeader(event, key, pageHeaders[key]);
        }
      });
    }
  };
  return {
    $ceApi,
    useCeApi,
    fetchPage,
    fetchMenu,
    getMessages,
    getPage,
    renderCustomElements,
    passThroughHeaders,
    getCeApiEndpoint,
    getDrupalBaseUrl,
    getMenuBaseUrl
  };
};
const pushMessagesToState = (messages) => {
  messages = Object.assign({ success: [], error: [] }, messages);
  const messagesArray = [
    ...messages.error.map((message) => ({ type: "error", message })),
    ...messages.success.map((message) => ({ type: "success", message }))
  ];
  if (!messagesArray.length) {
    return;
  }
  process.client && useDrupalCe().getMessages().value.push(...messagesArray);
};
const menuErrorHandler = (error) => {
  console.error({ statusCode: error.value.statusCode, statusMessage: error.value.message, data: error.value.data });
  process.client && useDrupalCe().getMessages().value.push({
    type: "error",
    message: `Menu error: ${error.value.message}.`
  });
};
const pageErrorHandler = (error, context) => {
  if (error.value && (!error.value?.data?.content || context?.config.customErrorPages)) {
    throw createError({ statusCode: error.value.statusCode, statusMessage: error.value.message, data: error.value.data, fatal: true });
  }
  if (context) {
    callWithNuxt(context.nuxtApp, setResponseStatus, [error.value.statusCode]);
  }
};
