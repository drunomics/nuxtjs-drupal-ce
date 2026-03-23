import { defu } from "defu";
import { appendResponseHeader } from "h3";
import { Fragment } from "vue";
import { getDrupalBaseUrl, getMenuBaseUrl } from "./server.js";
import { callWithNuxt } from "#app";
import { useRuntimeConfig, useState, useFetch, navigateTo, createError, h, resolveComponent, setResponseStatus, useNuxtApp, useRequestHeaders, ref, isRef, isReactive, toValue, watch, useRequestEvent, computed, useHead, defineComponent, toRef, useRoute, useRouter, useSlots } from "#imports";
export const useDrupalCe = () => {
  const config = useRuntimeConfig().public.drupalCe;
  const privateConfig = import.meta.server && useRuntimeConfig().drupalCe;
  const createEmptyPage = () => ({
    breadcrumbs: [],
    content: {},
    content_format: "json",
    local_tasks: { primary: [], secondary: [] },
    settings: {},
    messages: [],
    metatags: { meta: [], link: [], jsonld: [] },
    page_layout: "default",
    title: ""
  });
  const processFetchOptions = (fetchOptions = {}, skipDrupalCeApiProxy = false) => {
    if (config.serverApiProxy && !skipDrupalCeApiProxy) {
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
  const $ceApi = (fetchOptions = {}, skipDrupalCeApiProxy = false) => {
    const useFetchOptions = processFetchOptions(fetchOptions, skipDrupalCeApiProxy);
    return $fetch.create({
      ...useFetchOptions
    });
  };
  const useCeApi = (path, fetchOptions = {}, doPassThroughHeaders, skipDrupalCeApiProxy = false) => {
    const nuxtApp = useNuxtApp();
    const userQuery = fetchOptions.query;
    const hasReactiveQuery = isRef(userQuery) || isReactive(userQuery) || typeof userQuery === "function";
    if (hasReactiveQuery) {
      fetchOptions = { ...fetchOptions, query: void 0 };
    }
    fetchOptions.onResponse = (context) => {
      if (doPassThroughHeaders && import.meta.server && privateConfig?.passThroughHeaders) {
        const headersObject = Object.fromEntries([...context.response.headers.entries()]);
        passThroughHeaders(nuxtApp, headersObject);
      }
    };
    const processed = processFetchOptions(fetchOptions, skipDrupalCeApiProxy);
    if (hasReactiveQuery) {
      const queryDefaults = { ...processed.query };
      processed.query = computed(() => {
        const resolved = toValue(userQuery) ?? {};
        const merged = { ...queryDefaults, ...resolved };
        if (!merged._content_format) {
          delete merged._content_format;
        }
        return merged;
      });
    }
    return useFetch(path, {
      ...processed,
      $fetch: $ceApi(fetchOptions, skipDrupalCeApiProxy)
    });
  };
  const getCeApiEndpoint = (localize = true) => {
    const nuxtApp = useNuxtApp();
    if (localize && nuxtApp.$i18n?.locale?.value && nuxtApp.$i18n.locale.value !== nuxtApp.$i18n.defaultLocale) {
      return `${config.ceApiEndpoint}/${nuxtApp.$i18n.locale.value}`;
    }
    return config.ceApiEndpoint;
  };
  const computePageKey = (skipProxy, nuxtApp) => {
    const buildKey = (path) => {
      const sanitized = path.replace(/\/(\?|$)/, "$1");
      const proxyMode = skipProxy ? "-direct" : "-proxy";
      return `page-${sanitized}${proxyMode}`;
    };
    if (import.meta.prerender) {
      const route2 = useRoute();
      return buildKey(route2.path);
    }
    if (import.meta.server) {
      return "__ssr__";
    }
    const route = nuxtApp.$router?.currentRoute?.value || useRoute();
    const pathWithQuery = route.fullPath.split("#")[0];
    const properKey = buildKey(pathWithQuery);
    if (nuxtApp.payload.data["__ssr__"]) {
      nuxtApp.payload.data[properKey] = nuxtApp.payload.data["__ssr__"];
      delete nuxtApp.payload.data["__ssr__"];
    }
    return properKey;
  };
  const fetchPage = async (path, useFetchOptions = {}, overrideErrorHandler, skipDrupalCeApiProxy = false) => {
    const nuxtApp = useNuxtApp();
    const currentPageKey = useState("drupal-ce-current-page-key");
    const skipProxy = !(config.serverApiProxy && !skipDrupalCeApiProxy);
    if (!useFetchOptions.key) {
      useFetchOptions.key = computePageKey(skipProxy, nuxtApp);
    }
    const customPageResponse = import.meta.server ? useRequestEvent(nuxtApp).context.drupalCeCustomPageResponse : null;
    let pageRef;
    let error;
    if (customPageResponse) {
      pageRef = toRef(nuxtApp.payload.data, useFetchOptions.key);
      pageRef.value = customPageResponse._data;
      error = customPageResponse.error;
      if (customPageResponse._data) {
        passThroughHeaders(nuxtApp, customPageResponse.headers);
      }
    } else {
      const result = await useCeApi(path, useFetchOptions, true, skipDrupalCeApiProxy);
      pageRef = result.data;
      error = result.error.value;
    }
    if (pageRef.value?.messages) {
      pushMessagesToState(pageRef.value.messages);
    }
    if (pageRef.value?.redirect) {
      await callWithNuxt(nuxtApp, navigateTo, [
        pageRef.value.redirect.url,
        { external: pageRef.value.redirect.external, redirectCode: pageRef.value.redirect.statusCode, replace: true }
      ]);
      pageRef.value = createEmptyPage();
    } else if (error) {
      const errorData = error.data;
      const isValidPageStructure = errorData && typeof errorData.title === "string" && typeof errorData.content === "object" && typeof errorData.metatags === "object";
      if (!isValidPageStructure || config.customErrorPages) {
        (overrideErrorHandler || pageErrorHandler)({ value: error }, { config, nuxtApp });
        pageRef.value = createEmptyPage();
      } else {
        pageRef = toRef(nuxtApp.payload.data, useFetchOptions.key);
        pageRef.value = errorData;
        if (import.meta.server) {
          callWithNuxt(nuxtApp, setResponseStatus, [error.statusCode]);
        }
      }
    } else if (!pageRef.value) {
      pageRef.value = createEmptyPage();
    }
    pageRef.value.key = useFetchOptions.key;
    currentPageKey.value = useFetchOptions.key;
    return pageRef;
  };
  const fetchMenu = async (name, useFetchOptions = {}, overrideErrorHandler, skipDrupalCeApiProxy = false) => {
    const nuxtApp = useNuxtApp();
    useFetchOptions = processFetchOptions(useFetchOptions);
    useFetchOptions.key = useFetchOptions.key || `menu-${name}`;
    useFetchOptions.getCachedData = (key) => {
      if (nuxtApp.payload.data[key]) {
        return nuxtApp.payload.data[key];
      }
    };
    const baseMenuPath = config.menuEndpoint.replace("$$$NAME$$$", name);
    const menuPath = ref(baseMenuPath);
    const sanitizeMenuPath = (path) => path.startsWith("/") ? path.substring(1) : path;
    if (config.useLocalizedMenuEndpoint && nuxtApp.$i18n) {
      menuPath.value = sanitizeMenuPath(nuxtApp.$localePath("/" + baseMenuPath));
      watch(nuxtApp.$i18n.locale, () => {
        menuPath.value = sanitizeMenuPath(nuxtApp.$localePath("/" + baseMenuPath));
      });
    } else {
      menuPath.value = sanitizeMenuPath(menuPath.value);
    }
    if (config.serverApiProxy && !skipDrupalCeApiProxy) {
      useFetchOptions.baseURL = "/api/menu";
    } else {
      useFetchOptions.baseURL = getDrupalBaseUrl() + getCeApiEndpoint(false);
    }
    const { data: menu, error } = await useFetch(menuPath, useFetchOptions);
    if (error.value) {
      overrideErrorHandler ? overrideErrorHandler(error) : menuErrorHandler(error);
    }
    return menu;
  };
  const getMessages = () => useState("drupal-ce-messages", () => []);
  const getPage = (customKey) => {
    const nuxtApp = useNuxtApp();
    const currentPageKey = useState("drupal-ce-current-page-key", () => "");
    if (!customKey && import.meta.client) {
      const watcherInitialized = useState("drupal-ce-watcher-init", () => false);
      const pendingPageKey = useState("drupal-ce-pending-page-key", () => "");
      if (!watcherInitialized.value) {
        watcherInitialized.value = true;
        try {
          const router = useRouter();
          const skipProxy = !config.serverApiProxy;
          pendingPageKey.value = computePageKey(skipProxy, nuxtApp);
          router.afterEach(() => {
            pendingPageKey.value = computePageKey(skipProxy, nuxtApp);
          });
          watch(
            () => pendingPageKey.value && nuxtApp.payload.data[pendingPageKey.value],
            (page) => {
              if (page && pendingPageKey.value) {
                currentPageKey.value = pendingPageKey.value;
              }
            },
            { immediate: true }
          );
        } catch {
        }
      }
    }
    return computed(() => {
      const key = customKey || currentPageKey.value;
      if (key && nuxtApp.payload.data[key]) {
        return nuxtApp.payload.data[key];
      }
      return createEmptyPage();
    });
  };
  const resolveCustomElement = (element) => {
    const nuxtApp = useNuxtApp();
    const formatName = (name) => name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
    const component = nuxtApp.vueApp.component(formatName(element));
    if (typeof component === "object" && component.name) {
      return component;
    }
    const regex = /-?[^-]+$/;
    let componentName = element;
    while (componentName) {
      const fallbackComponent = nuxtApp.vueApp.component(formatName(componentName) + "Default");
      if (typeof fallbackComponent === "object" && fallbackComponent.name) {
        return fallbackComponent;
      }
      const newComponentName = componentName.replace(regex, "");
      if (newComponentName === componentName) {
        break;
      }
      componentName = newComponentName;
    }
    return typeof resolveComponent(element) === "object" ? resolveComponent(element) : null;
  };
  const renderCustomElementsToVNodes = (customElements) => {
    if (customElements == null) {
      return null;
    }
    if (typeof customElements === "string") {
      const component = resolveCustomElement("drupal-markup");
      if (component) {
        return h(component, { content: customElements });
      }
      return h("div", customElements);
    }
    if (Object.keys(customElements).length === 0) {
      return null;
    }
    if (Array.isArray(customElements)) {
      return customElements.map((element) => renderCustomElementsToVNodes(element));
    }
    if (config.customElementJsonFormat === "explicit") {
      const keys = Object.keys(customElements);
      const hasInvalidKeys = keys.some((key) => key !== "element" && key !== "props" && key !== "slots");
      if (hasInvalidKeys) {
        if (import.meta.dev) {
          console.warn('[nuxtjs-drupal-ce] Legacy format detected but explicit format expected. Auto-switching to legacy. Consider configuring customElementJsonFormat: "legacy" if your API uses the legacy format.');
        }
        const { element: element2, ...props2 } = customElements;
        const resolvedElement2 = resolveCustomElement(element2);
        return resolvedElement2 ? h(resolvedElement2, props2) : null;
      }
      const explicitElement = customElements;
      const { element, props = {}, slots = {} } = explicitElement;
      const resolvedElement = resolveCustomElement(element);
      if (!resolvedElement) {
        return null;
      }
      const slotFunctions = {};
      Object.entries(slots).forEach(([slotName, slotContent]) => {
        slotFunctions[slotName] = () => renderCustomElementsToVNodes(slotContent);
      });
      return h(resolvedElement, props, slotFunctions);
    } else {
      const { element, ...props } = customElements;
      const resolvedElement = resolveCustomElement(element);
      return resolvedElement ? h(resolvedElement, props) : null;
    }
  };
  const renderCustomElements = (customElements) => {
    const vnodes = renderCustomElementsToVNodes(customElements);
    if (Array.isArray(vnodes)) {
      return defineComponent({
        setup() {
          return () => vnodes;
        }
      });
    }
    return vnodes;
  };
  const passThroughHeaders = (nuxtApp, pageHeaders) => {
    if (!nuxtApp.ssrContext) {
      return;
    }
    const event = nuxtApp.ssrContext.event;
    if (pageHeaders) {
      Object.keys(pageHeaders).forEach((key) => {
        if (privateConfig?.passThroughHeaders.includes(key)) {
          appendResponseHeader(event, key, pageHeaders[key]);
        }
      });
    }
  };
  const usePageHead = (page, include) => {
    const parts = include || ["title", "meta", "link", "jsonld"];
    useHead({
      ...parts.includes("title") && { title: page.value.title },
      ...parts.includes("meta") && { meta: page.value.metatags.meta },
      ...parts.includes("link") && { link: page.value.metatags.link },
      ...parts.includes("jsonld") && { script: [{
        type: "application/ld+json",
        innerHTML: JSON.stringify(page.value.metatags.jsonld || [], null, "")
      }] }
    });
  };
  const getPageLayout = (page) => {
    const pageData = page || getPage();
    return computed(() => pageData.value?.page_layout || "default");
  };
  const getSlotItems = (slotName) => {
    const slots = useSlots();
    return computed(() => {
      const vnodes = slots[slotName]?.() ?? [];
      return vnodes.flatMap(
        (vnode) => vnode.type === Fragment ? vnode.children : [vnode]
      );
    });
  };
  return {
    $ceApi,
    useCeApi,
    fetchPage,
    fetchMenu,
    getMessages,
    getPage,
    renderCustomElements,
    renderCustomElementsToVNodes,
    resolveCustomElement,
    passThroughHeaders,
    getCeApiEndpoint,
    getDrupalBaseUrl,
    getMenuBaseUrl,
    getPageLayout,
    usePageHead,
    getSlotItems
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
  import.meta.client && useDrupalCe().getMessages().value.push(...messagesArray);
};
const menuErrorHandler = (error) => {
  console.error({ statusCode: error.value.statusCode, statusMessage: error.value.message, data: error.value.data });
  import.meta.client && useDrupalCe().getMessages().value.push({
    type: "error",
    message: `Menu error: ${error.value.message}.`
  });
};
const pageErrorHandler = (error, _context) => {
  const errorData = error.value.data;
  console.error("[nuxtjs-drupal-ce] Page fetch error:", {
    statusCode: error.value.statusCode,
    statusMessage: error.value.message,
    ...import.meta.dev && {
      data: errorData,
      cause: error.value.cause,
      stack: error.value.stack
    }
  });
  if (error.value.statusCode === 500 && errorData?.message === "fetch failed" && !errorData.statusMessage) {
    throw createError({
      statusCode: 503,
      statusMessage: "Unable to reach backend.",
      data: import.meta.dev ? errorData : void 0,
      cause: import.meta.dev ? error.value.cause : void 0,
      fatal: true
    });
  }
  throw createError({
    statusCode: error.value.statusCode,
    statusMessage: error.value?.message,
    data: import.meta.dev ? error.value.data : void 0,
    cause: import.meta.dev ? error.value.cause : void 0,
    fatal: true
  });
};
