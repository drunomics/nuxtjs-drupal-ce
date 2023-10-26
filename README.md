# nuxtjs-drupal-ce - Nuxt.js Drupal Custom Elements Connector

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
![ci](https://github.com/drunomics/nuxt-module-drupal-ce/workflows/ci/badge.svg)
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

1. Add `nuxtjs-drupal-ce` dependency to your Nuxt project

```bash
yarn add nuxtjs-drupal-ce@beta # or npm install nuxtjs-drupal-ce@beta
```

2. Add `nuxtjs-drupal-ce` to the `modules` section of `nuxt.config.js`

```js
export default defineNuxtConfig({
  modules: [
    'nuxtjs-drupal-ce',
  ],
  drupalCe: {
    baseURL: 'https://your-drupal.example.com/ce-api',
    // more options...
  }
})
```

The module defaults work well with [Lupus Decoupled Drupal](https://www.drupal.org/project/lupus_decoupled), so setting the `baseURL` is usually enough.

3. Get started quickly by scaffolding initial files:
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

- `baseURL`: The Drupal base URL. Defaults to the `DRUPAL_BASE_URL`
   environment variable if provided, otherwise to `http://localhost:8888`.

- `fetchOptions`: The default [fetchOptions](https://nuxt.com/docs/api/composables/use-fetch#params)
   to apply when fetching from the Drupal. Defaults to `{ credentials: 'include' }`.

- `fetchProxyHeaders`: The HTTP request headers to pass through to Drupal, via [useRequestHeaders](https://nuxt.com/docs/api/composables/use-request-headers#userequestheaders). Defaults to `['cookie']`.

- `menuEndpoint`: The menu endpoint pattern used for fetching menus. Defaults to 'api/menu_items/$$$NAME$$$' as fitting
  to the API provided by the [Rest menu items](https://www.drupal.org/project/rest_menu_items) Drupal module.
  `$$$NAME$$$` is replaced by the menu name being fetched.

- `addRequestContentFormat`: If specified, the given value is added as `_content_format`
  URL parameter to requests. Disabled by default.

- `addRequestFormat`: If set to `true`, the `_format=custom_elements` URL parameter
is added automatically to requests. Defaults to `false`.

- `customErrorPages`: By default, error pages provided by Drupal (e.g. 403, 404 page) are shown,
  while keeping the right status code. By enabling customErrorPages, the regular Nuxt error
  pages are shown instead, such that the pages can be customized with Nuxt. Defaults to `false`.

- `useLocalizedMenuEndpoint`: If enabled, the menu endpoint will use a language prefix as configured by [nuxtjs/i18n](https://v8.i18n.nuxtjs.org) module. Defaults to `true`.

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

## Customizing API route rules

API route rules can be customized by adding `nitro.routeRules` in Nuxt config:

```javascript
export default defineNuxtConfig({
  nitro: {
    routeRules: {
      '/drupal-ce/**': { swr: true },
    }
  }
})
```

The default route rules implemented are:

```javascript
'/api/drupal/**': { proxy: baseURLOrigin + '/**' }, // Base URL proxy.
'/api/drupal-ce/**': { proxy: options.baseURL + '/**' }, // Fetch page proxy.
'/api/menu/**': { proxy: options.baseURL + '/**', swr: nuxt.options.dev ? 0 : 300 } // Fetch menu proxy.
```

In order to disable this feature, `drupalCe.exposeAPIRouteRules` can be set to false:

```javascript
export default defineNuxtConfig({
  drupalCe: {
    exposeAPIRouteRules: false
  }
})
```

For more options, see [Nitro route rules](https://nitro.unjs.io/guide/routing).

## Previous options not supported in 2.x version

The following options were support in 1.x but got dropped:

- `addVueCompiler`: This is necessary if you want to render custom elements markup on runtime;
  i.e. use the 'markup' content format. If you need this, you may find a solution in this
  [GitHub issue](https://github.com/nuxt/nuxt/issues/13843).

- `axios`: Options to pass-through to the `drupal-ce`
  [axios](https://github.com/nuxt-community/axios-module) instance. Use `fetchOptions` instead.

- `useProxy`: If set to `dev-only` and nuxt is in dev-mode, the module automatically
  configures `/api` to the Drupal backend via
  [@nuxtjs/proxy](https://github.com/nuxt-community/proxy-module) and uses it instead of
  the Drupal backend, such that there are no CORS issues. Other values supported are
  `always` or false.
  Note: When using `always` the module must be added to the nuxt `modules` section instead
  of the `buildModules` section.

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
