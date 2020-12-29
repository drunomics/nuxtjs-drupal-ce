import { setupTest, get, getNuxt, url } from '@nuxt/test-utils'
const { exec } = require('child_process')

const setupBaseURL = () => {
  const nuxt = getNuxt()
  nuxt.options.publicRuntimeConfig['drupal-ce'].baseURL = url('/test-api')
}

describe('ssr-without-proxy', () => {
  setupTest({
    testDir: __dirname,
    fixture: '../example',
    server: true,
    config: {
      'nuxtjs-drupal-ce': {
        useProxy: false
      }
    }
  })

  beforeAll(async () => {
    await exec('cd example && ../bin/nuxt-drupal-ce-init.js')
  }, 60000)

  test('should render example-page', async () => {
    setupBaseURL()
    const { body } = await get('/example-page')
    expect(body).toContain('This is an example-page.')
    expect(body).toMatch(/<a .*href="\/node\/1".*>/)
    expect(body).not.toContain('<drupal-markup>')
    expect(body).toContain('<meta data-n-head="ssr" name="title" content="Example page | Drupal 9 Custom Elements Demo" data-hid="name:title">')
  })
})

describe('ssr-with-proxy', () => {
  setupTest({
    testDir: __dirname,
    fixture: '../example',
    server: true,
    config: {
      'nuxtjs-drupal-ce': {
        useProxy: 'always'
      }
    }
  })

  beforeAll(async () => {
    await exec('cd example && ../bin/nuxt-drupal-ce-init.js')
  }, 60000)

  test('should render example-page', async () => {
    setupBaseURL()
    const { body } = await get('/example-page')
    expect(body).toContain('This is an example-page.')
    expect(body).toMatch(/<a .*href="\/node\/1".*>/)
    expect(body).not.toContain('<drupal-markup>')
    expect(body).toContain('<meta data-n-head="ssr" name="title" content="Example page | Drupal 9 Custom Elements Demo" data-hid="name:title">')
  })
})
