# nuxtjs-drupal-ce - Nuxt.js Drupal Custom Elements Connector

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
![ci](https://github.com/drunomics/nuxt-module-drupal-ce/workflows/ci/badge.svg)
[![codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]

> Connects Nuxt.js with Drupal via the [Lupus Custom Elements Renderer](https://www.drupal.org/project/lupus_ce_renderer) 

Please refer to https://stack.lupus.digital for more info.

[📖 **Release Notes**](./CHANGELOG.md)

## Pre-requisites

* A [Drupal](https://drupal.org) backend with the 
  [Lupus Custom Elements Renderer](https://www.drupal.org/project/lupus_ce_renderer) 
  module installed. 

## Setup

1. Add `nuxtjs-drupal-ce` dependency to your Nuxt.js project

```bash
yarn add nuxtjs-drupal-ce # or npm install nuxtjs-drupal-ce
```

2. Add `nuxtjs-drupal-ce` to the `modules` section of `nuxt.config.js`

```js
{
  buildModules: [
    'nuxtjs-drupal-ce',
  ],
  'drupal-ce', {
    baseURL: 'https://your-drupal.example.com',
    // more options...
  }
}
```
3. Get started quickly by scaffolding initial files:
```bash
rm -f layouts/default.vue && $(npm bin)/nuxt-drupal-ce-init
```

You may also take a look at the [example project](https://github.com/drunomics/lupus-nuxtjs-drupal-stack-example).

## Options

- `baseURL`: The Drupal base URL. Defaults to the `DRUPAL_BASE_URL`
   environment variable if provided, otherwise to `http://localhost:8888`.

- `addRequestFormat`: If set to `true`, the `_format=custom_elements` URL parameter
  is added automatically to requests. Defaults to `true`. 
  
- `addRequestContentFormat`: If specified, the given value is added as `_content_format`
  URL parameter to requests. Disabled by default.

- `addVueCompiler`: If enabled, the Vue compiler is added to the runtime build. This
  is necessary if you want to render custom elements markup on runtime. Defaults to `true`.

- `menuEndpoint`: The menu endpoint pattern used for fetching menus. Defaults to 'api/menu_items/$$$NAME$$$' as fitting
  to the API provided by the [Rest menu items](https://www.drupal.org/project/rest_menu_items) Drupal module.
  `$$$NAME$$$` is replaced by the menu name being fetched. To enable menu fetching, un-comment the nuxtServerInit action
  in `store/init.js`.

- `useProxy`: If set to `dev-only` and nuxt is in dev-mode, the module automatically 
  configures `/api` to the Drupal backend via 
  [@nuxtjs/proxy](https://github.com/nuxt-community/proxy-module) and uses it instead of 
  the Drupal backend, such that there are no CORS issues. Other values supported are
  `always` or false.
   Note: When using `always` the module must be added to the nuxt `modules` section instead
   of the `buildModules` section.

- `axios`: Options to pass-through to the `drupal-ce`
  [axios](https://github.com/nuxt-community/axios-module) instance.

- `customErrorPages`: By default, error pages provided by Drupal (e.g. 403, 404 page) are shown,
   while keeping the right status code. By enabling customErrorPages, the regular Nuxt error
   pages are shown instead, such that the pages can be customized with Nuxt. Defaults to `false`.

- `pageErrorHandler`: The default page error handler can be overridden. Example:
  ```javascript
  pageErrorHandler ({ context, error }) {
    context.error({
      statusCode: error.response.status,
      message: error.message
    })
  }
  ```

- `menuErrorHandler`: The default menu error handler can be overridden. Example:
  ```javascript
  menuErrorHandler { commit, error }) {
    commit('addMessage', {
      type: 'error',
      message: `Custom menu error: ${error.message}.`
    })
  }
  ```


## Known issues

### Decoding HTML entities in plain-text strings

Vue2 has [known problem](https://github.com/vuejs/vue/issues/8805) when decoding HTML entities
of plain-text strings that are delivered as custom element attributes. While it correctly decodes
some HTML-encoded characters, it does not handle all of them.

The problem has been fixed in Vue3.

#### Filter "decodeSpecialChars"

For Vue2, this nuxt-module provides a Vue filter that can be used to work-a-round the issue.
Consider "teaser-text" being a prop containing a plain-text string. In that case, it's
recommended to use the provided filter:

   `{{ teaserText | decodeSpecialChars }}`


## Development

1. Clone this repository
2. Install dependencies using `yarn install` or `npm install`
3. Start development server using `npm run dev`

## Testing

Run `npm run test` or `yarn test`.

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
