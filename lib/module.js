import chalk from 'chalk'
const { resolve } = require('path')

module.exports = async function (moduleOptions) {
  const defaultOptions = {
    baseURL: process.env.DRUPAL_BASE_URL || 'http://localhost:8888',
    menuEndpoint: 'menu_items',
    addRequestFormat: 'custom_elements',
    addRequestContentFormat: false,
    addNoRequestRewriteForMenus: true,
    addVueCompiler: true,
    useProxy: 'dev-only',
    axios: {}
  }

  const options = {
    ...defaultOptions,
    ...this.options['nuxtjs-drupal-ce'],
    ...moduleOptions
  }

  const { nuxt } = this

  // Include the vue compiler in the build unless configured otherwise.
  if (options.addVueCompiler) {
    nuxt.options.build.extend = (config, context) => {
      config.resolve.alias.vue = 'vue/dist/vue.common'
    }
  }

  nuxt.options.cli.badgeMessages.push(`Drupal URL: ${chalk.underline.blue(options.baseURL)}`)

  if ((options.useProxy === 'dev-only' && nuxt.options.dev) || options.useProxy === 'always') {
    // In order to make dev-mode work, forward /api requests to our base-url
    // always. This is needed to avoid issues with CORS.
    nuxt.options.proxy = nuxt.options.proxy || {}
    nuxt.options.proxy['/api'] = { target: options.baseURL, pathRewrite: { '^/api': '' } }
    // Then use the plugin over use the proxy.
    const nuxtBaseUrl = (nuxt.options.server.https ? 'https' : 'http') + '://' + nuxt.options.server.host + ':' + nuxt.options.server.port

    options.baseURL = nuxtBaseUrl + '/api'
    nuxt.options.cli.badgeMessages.push(`via proxy:  ${chalk.underline.blue(options.baseURL)}`)
    // Allow passing custom HOST variables like foo.localdev.space for dev-mode.
    // @see https://github.com/drunomics/nuxt-module-drupal-ce/issues/6
    if (nuxt.options.server.host !== 'localhost') {
      nuxt.options.cli.badgeMessages.push(`Nuxt URL :  ${chalk.underline.blue(nuxtBaseUrl)}`)
    }
    await this.requireModule('@nuxtjs/proxy')
  }

  this.options.publicRuntimeConfig = this.options.publicRuntimeConfig || {}
  this.options.publicRuntimeConfig['drupal-ce'] = this.options.publicRuntimeConfig['drupal-ce'] || {}
  this.options.publicRuntimeConfig['drupal-ce'].baseURL = options.baseURL

  this.addPlugin({
    src: resolve(__dirname, 'plugin.js'),
    options
  })
  await this.requireModule('@nuxtjs/axios')
}

module.exports.meta = require('../package.json')
