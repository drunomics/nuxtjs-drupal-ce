import { defineNuxtModule, createResolver, addServerPlugin, addImportsDir, addServerHandler, installModule, addImports } from '@nuxt/kit';
import { defu } from 'defu';

function getCorsOrigin(nuxt) {
  const drupalBaseUrl = process.env.NUXT_PUBLIC_DRUPAL_CE_DRUPAL_BASE_URL || nuxt.options.runtimeConfig.public.drupalCe.drupalBaseUrl;
  if (!drupalBaseUrl) {
    return null;
  }
  try {
    const url = new URL(drupalBaseUrl);
    return url.origin;
  } catch {
    console.warn("[nuxtjs-drupal-ce] Invalid drupalBaseUrl:", drupalBaseUrl);
    return null;
  }
}
function setupCors(nuxt) {
  const { resolve } = createResolver(import.meta.url);
  if (nuxt.options.dev) {
    const corsOrigin = getCorsOrigin(nuxt);
    if (corsOrigin) {
      nuxt.options.vite = nuxt.options.vite || {};
      nuxt.options.vite.server = nuxt.options.vite.server || {};
      nuxt.options.vite.server.cors = defu(nuxt.options.vite.server.cors, {
        origin: [corsOrigin]
      });
    }
  }
  addServerPlugin(resolve("./runtime/server/plugins/componentPreviewCors"));
}
const module$1 = defineNuxtModule({
  meta: {
    name: "nuxtjs-drupal-ce",
    configKey: "drupalCe",
    compatibility: {
      nuxt: ">=3.7.0"
    }
  },
  defaults: {
    drupalBaseUrl: "",
    ceApiEndpoint: "/ce-api",
    menuEndpoint: "api/menu_items/$$$NAME$$$",
    customErrorPages: false,
    customElementJsonFormat: "explicit",
    fetchOptions: {
      credentials: "include"
    },
    fetchProxyHeaders: ["cookie"],
    useLocalizedMenuEndpoint: true,
    addRequestFormat: false,
    serverApiProxy: true,
    passThroughHeaders: ["cache-control", "content-language", "set-cookie", "x-drupal-cache", "x-drupal-dynamic-cache"],
    serverLogLevel: "info",
    disableFormHandler: false,
    enableComponentPreview: true
  },
  async setup(options, nuxt) {
    const nuxtOptions = nuxt.options;
    if (!nuxtOptions.drupalCe?.serverApiProxy && options.exposeAPIRouteRules !== void 0) {
      options.serverApiProxy = options.exposeAPIRouteRules;
    }
    if (nuxt.options._generate) {
      options.serverApiProxy = false;
    }
    const { resolve } = createResolver(import.meta.url);
    const runtimeDir = resolve("./runtime");
    nuxt.options.build.transpile.push(runtimeDir);
    if (options.serverLogLevel) {
      addServerPlugin(resolve(runtimeDir, "server/plugins/errorLogger"));
    }
    addImportsDir(resolve(runtimeDir, "composables/useDrupalCe"));
    if (!(options.disableFormHandler === true)) {
      addServerHandler({
        handler: resolve(runtimeDir, "server/middleware/drupalFormHandler")
      });
    }
    const publicOptions = { ...options };
    delete publicOptions.serverLogLevel;
    delete publicOptions.passThroughHeaders;
    delete publicOptions.exposeAPIRouteRules;
    delete publicOptions.disableFormHandler;
    nuxt.options.runtimeConfig.public.drupalCe = defu(nuxt.options.runtimeConfig.public.drupalCe ?? {}, publicOptions);
    nuxt.options.runtimeConfig.drupalCe = defu(nuxt.options.runtimeConfig.drupalCe ?? {}, {
      serverLogLevel: options.serverLogLevel,
      passThroughHeaders: options.passThroughHeaders,
      disableFormHandler: options.disableFormHandler
    });
    if (options.enableComponentPreview !== false) {
      await installModule("nuxt-component-preview");
      setupCors(nuxt);
      if (nuxt.options.dev) {
        nuxt.options.experimental = nuxt.options.experimental || {};
        nuxt.options.experimental.appManifest = false;
      }
    }
    if (options.serverApiProxy === true) {
      addServerHandler({
        route: "/api/drupal-ce",
        handler: resolve(runtimeDir, "server/api/drupalCe")
      });
      addServerHandler({
        route: "/api/drupal-ce/**",
        handler: resolve(runtimeDir, "server/api/drupalCe")
      });
      addServerHandler({
        route: "/api/menu/**",
        handler: resolve(runtimeDir, "server/api/menu")
      });
    }
    addImports([
      {
        name: "CustomElementContent",
        from: resolve("./types.d.ts"),
        type: true
      }
    ]);
  }
});

export { module$1 as default };
