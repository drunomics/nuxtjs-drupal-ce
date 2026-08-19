import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import DrupalCe from '../../'
import { join } from 'node:path'

describe('Drupal form handler', async () => {
  await setup({
    rootDir: join(fileURLToPath(import.meta.url), '../../../playground'),
    nuxtConfig: {
      modules: [
        DrupalCe,
      ],
      drupalCe: {
        drupalBaseUrl: 'http://127.0.0.1:3012',
        ceApiEndpoint: '/ce-api',
        disableFormHandler: ['/form/custom2'],
      },
    },
    port: 3012,
  })

  it('test with form handler enabled', async () => {
    const page = await createPage('/form/custom')
    const name = page.locator('input[name="name"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)
    expect(await submit.isVisible()).toBe(true)

    await name.fill('admin')
    await submit.click()

    await new Promise(resolve => setTimeout(resolve, 3000))

    expect(await page.content()).toContain('Form response received, submit was successful!')
  }, 15000)

  it('test with form handler disabled', async () => {
    const page = await createPage('/form/custom2')
    const name = page.locator('input[name="name"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)
    expect(await submit.isVisible()).toBe(true)

    await name.fill('admin')
    await submit.click()

    await new Promise(resolve => setTimeout(resolve, 3000))

    // Without form handler, the form should not display form response.
    expect(await page.content()).not.toContain('Form response received, submit was successful!')
  }, 15000)

  it('form handler skips API proxy routes', async () => {
    // POST to the API proxy route - the form handler should skip it,
    // allowing the API proxy to handle the request normally.
    const formData = new FormData()
    formData.append('name', 'test')
    const response = await fetch('http://127.0.0.1:3012/api/drupal-ce/form/custom', {
      method: 'POST',
      body: formData,
    })

    // The API proxy should forward the request and return a response.
    // If the form handler incorrectly processed it, the request would hang
    // or return an error because the body was already consumed.
    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toContain('Form response received')
  }, 15000)

  it('fetchProxyHeaders are forwarded to Drupal', async () => {
    const page = await createPage('/form/custom')

    // Set a cookie on the page before submitting.
    await page.context().addCookies([{
      name: 'test_session',
      value: 'abc123',
      domain: '127.0.0.1',
      path: '/',
    }])
    await page.reload()

    const name = page.locator('input[name="name"]')
    const submit = page.locator('input[type="submit"]')
    await name.fill('admin')
    await submit.click()

    await new Promise(resolve => setTimeout(resolve, 3000))

    // The mock server echoes back received cookies in data-received-cookie attribute.
    const content = await page.content()
    expect(content).toContain('Form response received, submit was successful!')
    expect(content).toContain('test_session=abc123')
  }, 15000)

  it('proxies an ?ajax_form=1 upload and returns the raw AJAX command response', async () => {
    // A managed_file upload button POSTs multipart to the form path with
    // ?ajax_form=1. The middleware must proxy it and return Drupal's AJAX command
    // JSON verbatim (with the X-Drupal-Ajax-Token header) instead of rendering an
    // SSR page, so core's ajax.js can apply the commands.
    const formData = new FormData()
    formData.append('files[speisekarte]', new Blob(['dummy'], { type: 'text/plain' }), 'menu.txt')
    formData.append('form_id', 'upload')

    const response = await fetch('http://127.0.0.1:3012/form/upload?ajax_form=1&_wrapper_format=drupal_ajax', {
      method: 'POST',
      body: formData,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    // The verification header must survive the proxy or ajax.js rejects the response.
    expect(response.headers.get('x-drupal-ajax-token')).toBe('1')
    // Other response headers obey the configured passThroughHeaders allow-list:
    // an allow-listed one passes, a non-listed one is dropped.
    expect(response.headers.get('x-drupal-cache')).toBe('MISS')
    expect(response.headers.get('x-custom-debug')).toBe(null)

    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0].command).toBe('insert')
    expect(data[0].selector).toBe('#edit-speisekarte-wrapper')
  }, 15000)

  it('a non-ajax POST to the same route still renders a page (not raw AJAX)', async () => {
    const formData = new FormData()
    formData.append('form_id', 'upload')

    const response = await fetch('http://127.0.0.1:3012/form/upload', {
      method: 'POST',
      body: formData,
      headers: { accept: 'text/html' },
    })

    expect(response.status).toBe(200)
    const text = await response.text()
    // The full-submit path goes through the SSR page render, not the raw proxy.
    expect(text).toContain('Form response received, submit was successful!')
  }, 15000)

  it('form handler is bypassed with not matching content-type header', async () => {
    const page = await createPage('/form/custom')
    const name = page.locator('input[name="name"]')
    const submit = page.locator('input[type="submit"]')

    expect(await name.isVisible()).toBe(true)
    expect(await submit.isVisible()).toBe(true)

    // Set up request interception to add the header.
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const headers = request.headers();
        headers['content-type'] = 'application/json';
        await route.continue({ headers });
      } else {
        await route.continue();
      }
    });

    await name.fill('admin')
    await submit.click()

    await page.waitForTimeout(3000)

    // With the not matching content-type, the form handler should bypass processing.
    expect(await page.content()).not.toContain('Form response received, submit was successful!')
  }, 15000)
})
