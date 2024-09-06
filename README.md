# nuxtjs-drupal-ce - Nuxt Drupal Custom Elements Connector

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![ci](https://github.com/drunomics/nuxtjs-drupal-ce/actions/workflows/ci.yml/badge.svg?branch=2.x)](https://github.com/drunomics/nuxtjs-drupal-ce/actions/workflows/ci.yml)
[![codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]

> Connects Nuxt v3 with Drupal via the [Lupus Custom Elements Renderer](https://www.drupal.org/project/lupus_ce_renderer) 

Please refer to https://www.drupal.org/project/lupus_decoupled for more info.

The 2.x version of the module is compatible with Nuxt 3. For a Nuxt 2 compatible version, please checkout the [1.x version](https://github.com/drunomics/nuxtjs-drupal-ce/tree/1.x)


## Pre-requisites

* A [Drupal](https://drupal.org) backend with the 
  [Lupus Custom Elements Renderer](https://www.drupal.org/project/lupus_ce_renderer) 
  module or [Lupus Decoupled Drupal](https://www.drupal.org/project/lupus_decoupled) installed. 

## Setup

1. Go to your Nuxt project. If necessary, start a new one:

```bash
npx nuxi@latest init <project-name>
```

2. Add the `nuxtjs-drupal-ce` module to your Nuxt project

```bash
npx nuxi@latest module add drupal-ce
```

3. Configure `nuxtjs-drupal-ce` in your `nuxt.config.js`

```js
export default defineNuxtConfig({
  modules: [
    'nuxtjs-drupal-ce',
  ],
  drupalCe: {
    drupalBaseUrl: 'https://your-drupal.example.com',
    // more options...
  }
})
```
The module defaults work well with [Lupus Decoupled Drupal](https://drupal.org/project/lupus_decoupled) - in that case setting the
`drupalBaseUrl` is enough to get started.

4. Scaffold initial files. After scaffolding, edit them as suiting.
```bash
rm -f app.vue && npx nuxt-drupal-ce-init
```


## Features

* Fetches pages via the custom elements API provided by the [Lupus Custom Elements Renderer](https://www.drupal.org/project/lupus_ce_renderer) 
* Provides a Nuxt-wildcard route, so all Drupal pages can be rendered via Nuxt.js and vue-router.
* Integrates page metadata and the page title with Nuxt.
* Supports breadcrumbs and local tasks ("Tabs")
* Supports authenticated requests. Cookies are passed through to Drupal by default.
* Supports display of Drupal messages in the frontend.
* Provides unstyled skeleton components for getting started quickly.
* Supports fetching and display of Drupal menus via the [Rest menu items](https://www.drupal.org/project/rest_menu_items) module.


## Options

- `drupalBaseUrl`: The Drupal base URL, e.g. `https://example.com:8080`. Required.

- `serverDrupalBaseUrl`: Optionally, an alternative drupal base URL to apply in server context.

- `ceApiEndpoint`: The custom elements API endpoint. Defaults to `/ce-api`.

- `fetchOptions`: The default [fetchOptions](https://nuxt.com/docs/api/composables/use-fetch#params)
   to apply when fetching from the Drupal. Defaults to `{ credentials: 'include' }`.

- `fetchProxyHeaders`: The HTTP request headers to pass through to Drupal, via [useRequestHeaders](https://nuxt.com/docs/api/composables/use-request-headers#userequestheaders). Defaults to `['cookie']`.

- `menuEndpoint`: The menu endpoint pattern used for fetching menus. Defaults to 'api/menu_items/$$$NAME$$$' as fitting
  to the API provided by the [Rest menu items](https://www.drupal.org/project/rest_menu_items) Drupal module.
  `$$$NAME$$$` is replaced by the menu name being fetched.

- `menuBaseUrl`: The menu base URL. Defaults to drupalBaseUrl + ceApiEndpoint.

- `addRequestContentFormat`: If specified, the given value is added as `_content_format`
  URL parameter to requests. Disabled by default.

- `addRequestFormat`: If set to `true`, the `_format=custom_elements` URL parameter
is added automatically to requests. Defaults to `false`.

- `customErrorPages`: By default, error pages provided by Drupal (e.g. 403, 404 page) are shown,
  while keeping the right status code. By enabling customErrorPages, the regular Nuxt error
  pages are shown instead, such that the pages can be customized with Nuxt. Defaults to `false`.

- `useLocalizedMenuEndpoint`: If enabled, the menu endpoint will use a language prefix as configured by [nuxtjs/i18n](https://v8.i18n.nuxtjs.org) module. Defaults to `true`.

- `serverApiProxy`: If enabled, the module will create a Nitro server handler that proxies API requests to Drupal backend. Defaults to `true` for SSR (it's disabled for SSG).

- `passThroughHeaders`: Response headers to pass through from Drupal to the client. Defaults to ['cache-control', 'content-language', 'set-cookie', 'x-drupal-cache', 'x-drupal-dynamic-cache']. Note: This is only available in SSR mode.

- `serverLogLevel`: The log level to use for server-side logging. Defaults to 'info'. Options:
  - false: The server plugin will not be loaded, keeps the default Nuxt error logging.
  - 'info': Log all server requests and errors.
  - 'error': Log only errors.

## Overriding options with environment variables

Runtime config values can be overridden with environment variables via `NUXT_PUBLIC_` prefix. Supported runtime overrides:

- `drupalBaseUrl` -> `NUXT_PUBLIC_DRUPAL_CE_DRUPAL_BASE_URL`
- `serverDrupalBaseUrl` -> `NUXT_PUBLIC_DRUPAL_CE_SERVER_DRUPAL_BASE_URL`
- `menuBaseUrl` -> `NUXT_PUBLIC_DRUPAL_CE_MENU_BASE_URL`
- `ceApiEndpoint` -> `NUXT_PUBLIC_DRUPAL_CE_CE_API_ENDPOINT`

## Custom elements rendering

Custom elements are rendered as [dynamic components](https://nuxt.com/docs/guide/directory-structure/components#dynamic-components) and need to be registered as global components.

The components should be placed in `~/components/global`, see `/playground` directory for an example.

### Naming

We recommend to name the components lowercase and hyphenate the custom element name, e.g. `custom-element-name.vue`.

### Component fallback (JSON only)

If a custom element is not resolved, the module will try to render a default component of that type.

The default components are named `<custom-element-name>--default.vue`, example:

```
node--default.vue
drupal-view--default.vue
```

When a component is not found, the module will lookup a default component by removing segments from the custom element name, e.g.:

```
x node-custom-view
x node-custom-view--default
x node-custom--default
✓ node--default
```

> **Note**: This is JSON only and not available when using the `markup` content format.

## Deprecated options

The following options are deprecated and only there for improved backwards compatibility.

- `baseURL`: The base URL of the Drupal /ce-api endpoint, e.g. http://localhost:8888/ce-api.
   If set, `drupalBaseUrl` is set with the origin of the provided URL.


## Error handling

The module provides a default error handler for the `fetchPage` and `fetchMenu` methods:

- `fetchPage`: Throws an error with the status code and message provided by Drupal.
- `fetchMenu`: Logs an error message to the console and displays a message in the frontend.

## Customizing error handling

You have the option to override the default error handlers by using a parameter when calling the `fetch` methods.

- `fetchPage`:
  ```javascript
  <script lang="ts" setup>
    const { fetchPage } = useDrupalCe()

    function customPageError (error: Record<string, any>) {
      throw createError({ statusCode: error.value.statusCode, statusMessage: 'No access.', data: {}, fatal: true })
    }
    const page = await fetchPage(useRoute().path, { query: useRoute().query }, customPageError)
  </script>
  ```

- `fetchMenu`:
  ```javascript
  <script lang="ts" setup>
    const { fetchMenu } = useDrupalCe()
    const { getMessages } = useDrupalCe()
    const messages = getMessages()

    function customMenuError (error: Record<string, any>) {
      messages.value.push({
        type: 'error',
        message: `Menu error: Unavailable. ${error.value.statusCode}`
      })
    }
    const mainMenu = await fetchMenu('main', {}, customMenuError)
  </script>
  ```

Note: The `error` parameter is optional and can be omitted.

## Previous options not supported in 2.x version

The following options were support in 1.x but got dropped:

- `addVueCompiler`: This is necessary if you want to render custom elements markup on runtime;
  i.e. use the 'markup' content format. Instead, the vue runtime compiler can be enabled in via
  Nuxt config, see [here](https://github.com/nuxt/framework/pull/4762).

- `axios`: Options to pass-through to the `drupal-ce`
  [axios](https://github.com/nuxt-community/axios-module) instance. Use `fetchOptions` instead.


## Development

1. Clone this repository.
2. Install dependencies using `npm install`.
3. Run `npm run dev:prepare` to generate type stubs.
4. Use `npm run dev` to start [playground](./playground) in development mode.
5. Update baseURL setting in Nuxt config with [Lupus Decoupled Drupal](https://www.drupal.org/project/lupus_decoupled) instance URL and append the API-prefix /ce-api, e.g. `https://8080-shaal-drupalpod-8m3z0ms7mb6.ws-eu67.gitpod.io/ce-api`

### Run on StackBlitz

1. [Launch it on StackBlitz](https://stackblitz.com/fork/github/drunomics/nuxtjs-drupal-ce/tree/2.x?startScript=dev:prepare,dev&file=playground/nuxt.config.ts)
2. Update baseURL setting in Nuxt config with [Lupus Decoupled Drupal](https://www.drupal.org/project/lupus_decoupled) instance URL and append the API-prefix /ce-api, e.g. `https://8080-shaal-drupalpod-8m3z0ms7mb6.ws-eu67.gitpod.io/ce-api`


## License

[MIT License](./LICENSE)

## Credits

Development sponsored by [drunomics](https://drunomics.com) <hello@drunomics.com>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxtjs-drupal-ce/latest.svg
[npm-version-href]: https://npmjs.com/package/nuxtjs-drupal-ce

[npm-downloads-src]: https://img.shields.io/npm/dt/nuxtjs-drupal-ce.svg
[npm-downloads-href]: https://npmjs.com/package/nuxtjs-drupal-ce

[codecov-src]: https://codecov.io/gh/drunomics/nuxt-module-drupal-ce/branch/1.x/graph/badge.svg?token=vX3zknQWZv
[codecov-href]: https://codecov.io/gh/drunomics/nuxt-module-drupal-ce

[license-src]: https://img.shields.io/npm/l/nuxtjs-drupal-ce.svg
[license-href]: https://npmjs.com/package/nuxtjs-drupal-ce
