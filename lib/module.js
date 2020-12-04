import chalk from 'chalk'
const { resolve } = require('path')

module.exports = async function (moduleOptions) {
  const defaultOptions = {
    baseURL: process.env.DRUPAL_BASE_URL || 'http://localhost:8123',
    requestFormat: 'custom_elements',
    requestContentFormat: 'markup',
    axios: {}
  }

  const options = {
    ...this.options['@nuxtjs/drupal-ce'],
    ...moduleOptions,
    ...defaultOptions
  }

  const { nuxt } = this
  nuxt.options.cli.badgeMessages.push(`Drupal URL: ${chalk.underline.blue(options.baseURL)}`)

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
