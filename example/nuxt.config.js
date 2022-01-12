import { resolve } from 'path'

export default {
  components: true,
  modules: [
    resolve(__dirname, '..')
  ],
  'drupal-ce': {
    baseURL: 'http://localhost:3000/test-api/'
  }
}
