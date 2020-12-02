# @nuxtjs/drupal-ce

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions CI][github-actions-ci-src]][github-actions-ci-href]
[![Codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]

> Easily connect Nuxt.js to Drupal via custom elements.

[📖 **Release Notes**](./CHANGELOG.md)

## Setup

1. Add `@nuxtjs/drupal-ce` dependency to your project

```bash
yarn add @nuxtjs/drupal-ce # or npm install @nuxtjs/drupal-ce
```

2. Add `@nuxtjs/drupal-ce` to the `modules` section of `nuxt.config.js`

```js
{
  modules: [
    // Simple usage
    '@nuxtjs/drupal-ce',

    // With options
    ['@nuxtjs/drupal-ce', { /* module options */ }]
  ]
}
```

## Development

1. Clone this repository
2. Install dependencies using `yarn install` or `npm install`
3. Start development server using `npm run dev`

## License

[MIT License](./LICENSE)

Copyright (c) Wolfgang Ziegler // fago <fago@wolfgangziegler.net>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@nuxtjs/drupal-ce/latest.svg
[npm-version-href]: https://npmjs.com/package/@nuxtjs/drupal-ce

[npm-downloads-src]: https://img.shields.io/npm/dt/@nuxtjs/drupal-ce.svg
[npm-downloads-href]: https://npmjs.com/package/@nuxtjs/drupal-ce

[github-actions-ci-src]: https://github.com/drunomics/nuxt-drupal-ce/workflows/ci/badge.svg
[github-actions-ci-href]: https://github.com/drunomics/nuxt-drupal-ce/actions?query=workflow%3Aci

[codecov-src]: https://img.shields.io/codecov/c/github/drunomics/nuxt-drupal-ce.svg
[codecov-href]: https://codecov.io/gh/drunomics/nuxt-drupal-ce

[license-src]: https://img.shields.io/npm/l/@nuxtjs/drupal-ce.svg
[license-href]: https://npmjs.com/package/@nuxtjs/drupal-ce
