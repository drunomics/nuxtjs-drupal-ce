const { resolve } = require('path')

module.exports = {
  components: true,
  modules: [
    resolve(__dirname, '..'),
  ],
  'nuxtjs-drupal-ce': {
    baseURL: 'http://localhost:3000/test-api/'
  }
}
