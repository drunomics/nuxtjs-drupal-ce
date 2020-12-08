# nuxtjs-drupal-ce

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

> Easily connect Nuxt.js to Drupal via custom elements.

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
  modules: [
    // Simple usage
    'nuxtjs-drupal-ce',

    // With options
    ['nuxtjs-drupal-ce', {
      baseURL: 'https://your-drupal.example.com'
    }]
  ]
}
```
3. Get started quickly by scaffolding initial files:
```bash
$(npm bin)/nuxt-drupal-ce-init
```

You may also take a look at the [example project](https://github.com/drunomics/nuxt-drupal-ce-example).

## Options

- `baseURL`: The Drupal base URL. May be overridden by an environment variable
  `DRUPAL_BASE_URL` if set. Defaults to http://localhost:8888'.

- `addRequestFormat`: If set to `true`, the `_format=custom_elements` URL parameter
  is added automatically to requests. Defaults to `true`. 
  
- `addRequestContentFormat`: If specified, the given value is added as `_content_format`
  URL parameter to requests. Disabled by default.

- `addVueCompiler`: If enabled, the Vue compiler is added to the runtime build. This
  is necessary if you want to render custom elements markup on runtime. Defaults to `true`.
  
- `axios`: Options to pass-through to the `drupal-ce`
  [axios](https://github.com/nuxt-community/axios-module) instance.

## Development

1. Clone this repository
2. Install dependencies using `yarn install` or `npm install`
3. Start development server using `npm run dev`

## License

[MIT License](./LICENSE)

## Credits

Development sponsored by [drunomics](https://drunomics.com) <hello@drunomics.com>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxtjs-drupal-ce/latest.svg
[npm-version-href]: https://npmjs.com/package/nuxtjs-drupal-ce

[npm-downloads-src]: https://img.shields.io/npm/dt/nuxtjs-drupal-ce.svg
[npm-downloads-href]: https://npmjs.com/package/nuxtjs-drupal-ce

[github-actions-ci-src]: https://github.com/drunomics/nuxt-drupal-ce/workflows/ci/badge.svg
[github-actions-ci-href]: https://github.com/drunomics/nuxt-drupal-ce/actions?query=workflow%3Aci

[codecov-src]: https://img.shields.io/codecov/c/github/drunomics/nuxt-drupal-ce.svg
[codecov-href]: https://codecov.io/gh/drunomics/nuxt-drupal-ce

[license-src]: https://img.shields.io/npm/l/nuxtjs-drupal-ce.svg
[license-href]: https://npmjs.com/package/nuxtjs-drupal-ce
