import chalk from 'chalk'
const { resolve } = require('path')

module.exports = async function (moduleOptions) {
  const defaultOptions = {
    baseURL: process.env.DRUPAL_BASE_URL || 'http://localhost:8888',
    addRequestFormat: 'custom_elements',
    addRequestContentFormat: false,
    addVueCompiler: true,
    axios: {}
  }

  const options = {
    ...defaultOptions,
    ...this.options['nuxtjs-drupal-ce'],
    ...moduleOptions
  }

  const { nuxt } = this
  nuxt.options.cli.badgeMessages.push(`Drupal URL: ${chalk.underline.blue(options.baseURL)}`)

  // Include the vue compiler in the build unless configured otherwise.
  if (options.addVueCompiler) {
    nuxt.options.build.extend = (config, context) => {
      config.resolve.alias.vue = 'vue/dist/vue.common'
    }
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
