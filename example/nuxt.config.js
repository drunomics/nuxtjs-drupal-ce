const { resolve } = require('path')

module.exports = {
  components: true,
  modules: [
    resolve(__dirname, '..')
  ],
  'drupal-ce': {
    baseURL: 'http://localhost:3000/test-api/'
  }
}
