import { setupTest, get, getNuxt, url } from '@nuxt/test-utils'
const { exec } = require('child_process')

const initDelay = 40000

const setupBaseURL = () => {
  const nuxt = getNuxt()
  nuxt.options.publicRuntimeConfig['drupal-ce'] = {
    baseURL: url('/test-api')
  }
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
  }, initDelay)

  test('should render example-page', async () => {
    setupBaseURL()
    const { body } = await get('/example-page')
    expect(body).toContain('This is an example-page.')
    expect(body).toMatch(/<a .*href="\/node\/1".*>/)
    expect(body).not.toContain('<drupal-markup>')
    expect(body).toContain('<meta data-n-head="ssr" name="title" content="Example page | Drupal 9 Custom Elements Demo" data-hid="name:title">')
    expect(body).toMatch(/<a .*href="\/channel-science".*>/)
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
  }, initDelay)

  test('should render example-page', async () => {
    setupBaseURL()
    const { body } = await get('/example-page')
    expect(body).toContain('This is an example-page.')
    expect(body).toMatch(/<a .*href="\/node\/1".*>/)
    expect(body).not.toContain('<drupal-markup>')
    expect(body).toContain('<meta data-n-head="ssr" name="title" content="Example page | Drupal 9 Custom Elements Demo" data-hid="name:title">')
    expect(body).toMatch(/<a .*href="\/channel-science".*>/)
  })
})

describe('ssr-apply-redirect', () => {
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
  }, initDelay)

  test('redirects to example-page', async () => {
    setupBaseURL()
    const { statusCode } = await get('/example-redirect', { followRedirect: false })
    expect(statusCode).toEqual(301)
    const { body } = await get('/example-redirect')
    expect(body).toContain('This is an example-page.')
  })
})

describe('rendering-special-chars', () => {
  setupTest({
    testDir: __dirname,
    fixture: '../example',
    server: true
  })

  beforeAll(() => {
    exec('cd example && ../bin/nuxt-drupal-ce-init.js')
  }, initDelay)

  it('renders HTML special chars correctly', async () => {
    setupBaseURL()
    const { body } = await get('/example-teasers')
    expect(body).toContain("It's a great day! &lt;1000€&gt;")
  })
})
