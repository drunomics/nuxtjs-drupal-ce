
# nuxtjs-drupal-ce - Nuxt Drupal Custom Elements Connector

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![ci](https://github.com/drunomics/nuxtjs-drupal-ce/actions/workflows/ci.yml/badge.svg?branch=2.x)](https://github.com/drunomics/nuxtjs-drupal-ce/actions/workflows/ci.yml)
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
* Integrates with nuxt-component-preview and autoconfigures it 

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

- `customElementJsonFormat`: Specifies the JSON format for custom elements. Options:
  - `'explicit'`: Suggested format with separated `props` and `slots` objects (default). Automatically falls back to legacy format if a different structure is detected.
  - `'legacy'`: Legacy format with props and slots flattened at the same level. Explicitly configure this for improved compatibility with older backends.
  Defaults to `'explicit'`.

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

- `disableFormHandler`: If set to `true`, the form handler middleware will be disabled. Defaults to `false`.

- `enableComponentPreview`: Enable component preview for Drupal Canvas integration. Automatically configures CORS based on `drupalBaseUrl`. Set to `false` to disable. Defaults to `true`.

- `skipLibraryScripts`: List of URL substrings for Drupal JS files the library loader must not load (in addition to `core/misc/drupalSettingsLoader.js`, which is always skipped). Defaults to `[]`.

## Overriding options with environment variables

Runtime config values can be overridden with environment variables via `NUXT_PUBLIC_` prefix. Supported runtime overrides:

- `drupalBaseUrl` -> `NUXT_PUBLIC_DRUPAL_CE_DRUPAL_BASE_URL`
- `serverDrupalBaseUrl` -> `NUXT_PUBLIC_DRUPAL_CE_SERVER_DRUPAL_BASE_URL`
- `menuBaseUrl` -> `NUXT_PUBLIC_DRUPAL_CE_MENU_BASE_URL`
- `ceApiEndpoint` -> `NUXT_PUBLIC_DRUPAL_CE_CE_API_ENDPOINT`

## Rendering custom elements

Generally, custom elements are rendered as [dynamic components](https://nuxt.com/docs/guide/directory-structure/components#dynamic-components) and simply need to be registered as global components.

The components should be placed in `~/components/global`, refer to the `/playground` directory for an example.
For example, for the custom element `node-article-teaser` a global component `node-article-teaser.vue` would be
picked up for rendering.

### JSON Format Options

The module supports two JSON formats for custom elements:

**Explicit Format** (default, recommended):
```json
{
  "element": "node-article-teaser",
  "props": {
    "title": "Article Title",
    "nid": 123
  },
  "slots": {
    "default": "Content goes here",
    "sidebar": { "element": "drupal-block", "props": {...} }
  }
}
```

**Legacy Format** (for backward compatibility):
```json
{
  "element": "node-article-teaser",
  "title": "Article Title",
  "nid": 123,
  "default": "Content goes here"
}
```

The explicit format clearly separates props from slots, making the structure more maintainable.

**Compatibility Note**: The default `'explicit'` format automatically falls back to legacy format when it detects a different structure. However, for improved compatibility with older Drupal backends, it's recommended to explicitly configure `customElementJsonFormat: 'legacy'`.

### Naming recommendation

We recommend to name the components lowercase using kebap-case, such that there is a clear 1:1 mapping between
custom element names used in the API response and the frontend components. For
example use `custom-element-name.vue` instead of `CustomElementName.vue`. Both variants work though.

### Rendering markup strings: the `v-drupal-markup` directive

Markup strings in the API response are rendered through your project's
`drupal-markup` component. The module registers the `v-drupal-markup` directive
app-wide — update that component (and any other place rendering HTML Drupal
produced) to use it instead of `v-html`:

```vue
<template>
  <div v-drupal-markup="content" style="display: contents" />
</template>
```

See `playground/components/global/drupal-markup.vue` for the full reference
component.

#### Why not `v-html`

Server-delivered markup keeps evolving outside of Vue: a visitor types into a
Drupal form, the browser autofills it, Drupal libraries attach listeners, a
lazy-loader swaps image sources. All of that happens in DOM Vue does not own.

`v-html` binds `innerHTML`, and hydration re-applies a vnode's bound props over
the live DOM since
([vuejs/core#15138](https://github.com/vuejs/core/issues/15138), vue >= 3.5.39).
That way, anything that happened in the server-rendered markup before hydration
would be lost. `v-drupal-markup` renders the markup into the server response
only, which leaves hydration nothing to re-apply.


### Default components (JSON only)

When using JSON-based rendering of custom elements, the module offers fallback component support. If a custom element lacks a corresponding Vue component, the module attempts to find a suitable default component.

#### How it works:

1. The module removes the last `-`-separated prefix from the element name.
2. It then appends a `--default` suffix.
3. If this modified component exists, it's used for rendering.
4. If the component is not exiting, the process is repeated.

This approach allows for generic default components like `drupal-form--default.vue` to be used for specific elements such as `drupal-form-user-login-form.vue`. For customization, developers can simply copy and modify the default component as needed.

#### Example lookup process

When a specific component isn't found, the module searches for a default component by progressively removing segments from the custom element name. For example when rendering the custom element `node-custom-view` it looks for components in the following order:

```
x node-custom-view.vue
x node-custom-view--default.vue
x node-custom--default.vue
✓ node--default.vue
```

## Loading Drupal JavaScript libraries

The backend emits the JavaScript libraries attached to a rendered form, block or
component as `drupal-library-*` elements. To load them, add a global
`drupal-library--default.vue` component - see
`playground/components/global/drupal-library--default.vue` for a renderless
reference component handing the library to `useDrupalCe().loadLibrary()`, and
`/form/states` in the playground for a form whose conditional field is driven
this way.

Docs: [Drupal JS libraries](https://lupus-decoupled.org/nuxt/drupal-libraries)
for the Nuxt side, [Drupal JavaScript](https://lupus-decoupled.org/advanced-topics/drupal-javascript)
for what the backend sends.

## Component Preview Integration

Built-in support for [nuxt-component-preview](https://github.com/drunomics/nuxt-component-preview) enables fully-rendered component previews in Drupal and easy Drupal Canvas integration. It works automatically with your `drupalBaseUrl` - CORS is configured automatically.

Visit `/nuxt-component-preview/component-index.json` to see your components.

**Configuration**: Configure nuxt-component-preview at root level:
```js
export default defineNuxtConfig({
  drupalCe: {
    drupalBaseUrl: 'https://drupal.example.com'
  },
  componentPreview: {
    // See https://github.com/drunomics/nuxt-component-preview#configuration
    componentIndex: { status: 'experimental' }
  }
})
```

See [nuxt-component-preview documentation](https://github.com/drunomics/nuxt-component-preview) for details.

**Opt-out:** Disable the feature:
```js
drupalCe: {
  enableComponentPreview: false
}
```

## Form handler middleware

The form handler middleware is used to process Drupal form submissions by forwarding form-POST
requests to Drupal and rendering the response as usual. This option allows you to bypass this
middleware for certain routes or to disable it globally.

### Route level

To bypass the form handler middleware for certain routes, you can use the `disableFormHandler` option with an array of routes:

```js
export default defineNuxtConfig({
  drupalCe: {
    disableFormHandler: ['/custom-form'],
  },
})
```

### Global level

To disable the form handler middleware globally, you can use the `disableFormHandler` option with `true`:

```js
export default defineNuxtConfig({
  drupalCe: {
    disableFormHandler: true,
  },
})
```

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

## Deferred menu loading

`fetchMenu()` is a setup-time helper built on Nuxt's `useFetch()`. Call it directly
from `<script setup>` so Nuxt can register its hydration lifecycle hooks.

When a menu should load later from `onMounted()`, a watcher, or an event handler,
create the request with `useMenu()` during setup and execute it when needed:

```vue
<script lang="ts" setup>
const { useMenu } = useDrupalCe()
const { data: accountMenu, execute: loadAccountMenu } = useMenu('account', {
  immediate: false,
  server: false,
})

onMounted(() => loadAccountMenu())
</script>
```

## Previous options not supported in 2.x version

The following options were support in 1.x but got dropped:

- `addVueCompiler`: This is necessary if you want to render custom elements markup on runtime;
  i.e. use the 'markup' content format. Instead, the vue runtime compiler can be enabled in via
  Nuxt config, see [here](https://github.com/nuxt/framework/pull/4762).

- `axios`: Options to pass-through to the `drupal-ce`
  [axios](https://github.com/nuxt-community/axios-module) instance. Use `fetchOptions` instead.


## Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Generate type stubs: `npm run dev:prepare`
4. Start playground in dev mode: `npm run dev`
5. Configure `drupalBaseUrl` in `playground/nuxt.config.ts` to point to your Drupal instance

### Run on StackBlitz

1. [Launch it on StackBlitz](https://stackblitz.com/fork/github/drunomics/nuxtjs-drupal-ce/tree/2.x?startScript=dev:prepare,dev&file=playground/nuxt.config.ts)
2. Configure `drupalBaseUrl` in Nuxt config to point to your Drupal instance


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
