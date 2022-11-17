import { resolve } from 'path'
import chalk from 'chalk'

import { name, version } from '../package.json'

async function drupalCe (moduleOptions) {
  const defaultOptions = {
    baseURL: process.env.DRUPAL_BASE_URL || 'http://localhost:8888',
    menuEndpoint: 'api/menu_items/$$$NAME$$$',
    useLocalizedMenuEndpoint: true,
    addRequestFormat: 'custom_elements',
    addRequestContentFormat: false,
    addVueCompiler: true,
    useProxy: 'dev-only',
    axios: {},
    customErrorPages: false
  }

  const options = {
    ...defaultOptions,
    ...this.options['nuxtjs-drupal-ce'],
    ...this.options['drupal-ce'],
    ...moduleOptions
  }

  // Add the baseUrL to publicRuntimeConfig - so changes to baseURL apply
  // without having to set publicRuntimeConfig manually.
  this.options.publicRuntimeConfig = this.options.publicRuntimeConfig || {}
  this.options.publicRuntimeConfig['drupal-ce'] = this.options.publicRuntimeConfig['drupal-ce'] || {}
  this.options.publicRuntimeConfig['drupal-ce'].baseURL = options.baseURL

  const { nuxt } = this

  // Include the vue compiler in the build unless configured otherwise.
  if (options.addVueCompiler) {
    nuxt.options.build.extend = (config, context) => {
      config.resolve.alias.vue = config.resolve.alias.vue || 'vue/dist/vue.common'
    }
  }

  nuxt.options.cli.badgeMessages.push(`Drupal URL: ${chalk.underline.blue(options.baseURL)}`)

  if ((options.useProxy === 'dev-only' && nuxt.options.dev) || options.useProxy === 'always') {
    // In order to make dev-mode work, forward /api requests to our base-url
    // always. This is needed to avoid issues with CORS.
    nuxt.options.proxy = nuxt.options.proxy || {}
    nuxt.options.proxy['/api'] = { target: options.baseURL, pathRewrite: { '^/api': '' } }
    const nuxtBaseUrl = (nuxt.options.server.https ? 'https' : 'http') + '://' + nuxt.options.server.host + ':' + nuxt.options.server.port
    options.baseURL = nuxtBaseUrl + '/api'
    options.axios.browserBaseURL = '/api'
    nuxt.options.cli.badgeMessages.push(`via proxy:  ${chalk.underline.blue(options.baseURL)}`)
    await this.requireModule('@nuxtjs/proxy')
  }

  this.addPlugin({
    src: resolve(__dirname, 'plugin.mjs'),
    options
  })

  await this.requireModule('@nuxtjs/axios')
}

drupalCe.meta = { name, version }

export default drupalCe
