import { fileURLToPath } from 'url';
import { defineNuxtModule, createResolver, addPlugin, addServerPlugin, addImportsDir, addServerHandler } from '@nuxt/kit';
import { defu } from 'defu';

const module = defineNuxtModule({
  meta: {
    name: "nuxtjs-drupal-ce",
    configKey: "drupalCe",
    compatibility: {
      nuxt: "^3.2.2"
    }
  },
  defaults: {
    drupalBaseUrl: "",
    ceApiEndpoint: "/ce-api",
    menuEndpoint: "api/menu_items/$$$NAME$$$",
    customErrorPages: false,
    fetchOptions: {
      credentials: "include"
    },
    fetchProxyHeaders: ["cookie"],
    useLocalizedMenuEndpoint: true,
    addRequestFormat: false,
    serverApiProxy: true,
    passThroughHeaders: ["cache-control", "content-language", "set-cookie", "x-drupal-cache", "x-drupal-dynamic-cache"],
    errorLogger: true
  },
  setup(options, nuxt) {
    const nuxtOptions = nuxt.options;
    if (!nuxtOptions.drupalCe?.serverApiProxy && options.exposeAPIRouteRules !== void 0) {
      options.serverApiProxy = options.exposeAPIRouteRules;
    }
    if (nuxt.options._generate) {
      options.serverApiProxy = false;
    }
    const { resolve } = createResolver(import.meta.url);
    const runtimeDir = fileURLToPath(new URL("./runtime", import.meta.url));
    nuxt.options.build.transpile.push(runtimeDir);
    addPlugin(resolve(runtimeDir, "plugin"));
    if (options.errorLogger) {
      addServerPlugin(resolve(runtimeDir, "server/plugins/errorLogger"));
    }
    addImportsDir(resolve(runtimeDir, "composables/useDrupalCe"));
    nuxt.options.runtimeConfig.public.drupalCe = defu(nuxt.options.runtimeConfig.public.drupalCe ?? {}, options);
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
  }
});

export { module as default };
