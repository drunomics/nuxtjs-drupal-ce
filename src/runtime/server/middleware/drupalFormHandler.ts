import { defineEventHandler, readFormData, setResponseStatus, appendResponseHeader } from 'h3'
import { getDrupalBaseUrl, headersToRecord } from '../../composables/useDrupalCe/server'
import { useRuntimeConfig } from '#imports'

/**
 * The X-Drupal-Ajax-Token verification header is always passed through on a
 * proxied AJAX form response: ajax.js rejects an AJAX command response that
 * lacks it. Every other response header obeys the configured passThroughHeaders
 * allow-list.
 */
const AJAX_REQUIRED_HEADER = 'x-drupal-ajax-token'

export default defineEventHandler(async (event) => {
  const { disableFormHandler, passThroughHeaders } = useRuntimeConfig().drupalCe
  const { ceApiEndpoint, fetchProxyHeaders, fetchOptions } = useRuntimeConfig().public.drupalCe

  // Skip API proxy routes - we don't want to handle them here.
  const currentPath = event.node.req.url?.split('?')[0] || ''
  if (currentPath.startsWith('/api/drupal-ce/') || currentPath === '/api/drupal-ce') {
    return
  }

  if (event.node.req.method !== 'POST') {
    return
  }

  const routesToBypass = Array.isArray(disableFormHandler) ? disableFormHandler : []
  if (routesToBypass.length) {
    const shouldBypass = routesToBypass.some(route => {
      const routeFormats = [
        route,
        '/api/drupal-ce' + route,
        ceApiEndpoint + route,
      ]
      return routeFormats.some(format => format === currentPath)
    })

    if (shouldBypass) {
      return
    }
  }

  const contentType = event.node.req.headers['content-type'] || ''
  if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded') || event.node.req.headers['x-form-processed']) {
    return
  }

  const formData = await readFormData(event)

  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'POST requests without form data are not supported (drupalFormHandler).',
    })
  }

  const targetUrl = event.node.req.url

  // Drupal AJAX form requests (e.g. a managed_file upload / remove button) POST
  // to the form's own path with ?ajax_form=1. Core builds that URL root-relative
  // (Url::fromRoute('<current>')), so in the decoupled frontend it lands on this
  // origin — and thus on this proxy — rather than cross-origin on the backend.
  // Such a request expects Drupal's AJAX command response (JSON) back verbatim so
  // ajax.js can apply the commands; the SSR page-render flow below is only right
  // for a full (non-AJAX) form submit.
  const isAjaxForm = new URLSearchParams(targetUrl?.split('?')[1] || '').has('ajax_form')

  // Forward configured proxy headers (e.g. cookie) from the original request.
  const proxyHeaders: Record<string, string> = {}
  if (Array.isArray(fetchProxyHeaders)) {
    for (const name of fetchProxyHeaders) {
      const value = event.node.req.headers[name.toLowerCase()]
      if (value) {
        proxyHeaders[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value
      }
    }
  }

  const response = await $fetch.raw(getDrupalBaseUrl() + ceApiEndpoint + targetUrl, {
    method: 'POST',
    body: formData,
    headers: {
      ...fetchOptions?.headers,
      ...proxyHeaders,
      'x-form-processed': 'true',
    },
  }).catch((error) => {
    if (isAjaxForm) {
      // Surface the failure to ajax.js as an HTTP error instead of routing it
      // through the page-render error handling.
      throw createError({
        statusCode: error.statusCode || 502,
        statusMessage: error.statusMessage || 'Bad Gateway',
        message: error.message || 'Error when proxying AJAX form request (drupalFormHandler).',
      })
    }
    event.context.drupalCeCustomPageResponse = {
      error: {
        data: error,
        statusCode: error.statusCode || 400,
        message: error.message || 'Error when POSTing form data (drupalFormHandler).',
      },
    }
  })

  if (isAjaxForm) {
    if (response) {
      setResponseStatus(event, response.status)
      // Obey the configured passThroughHeaders allow-list (same setting the SSR
      // page-render path uses), plus the X-Drupal-Ajax-Token header ajax.js
      // requires, then return the AJAX command payload directly — short-circuiting
      // the SSR render.
      const allowed = new Set(
        [...(Array.isArray(passThroughHeaders) ? passThroughHeaders : []), AJAX_REQUIRED_HEADER]
          .map(name => name.toLowerCase()),
      )
      const responseHeaders = headersToRecord(response.headers)
      for (const [name, value] of Object.entries(responseHeaders)) {
        if (!allowed.has(name.toLowerCase())) {
          continue
        }
        // headersToRecord keeps multiple Set-Cookie values as an array; append
        // each one so they are not comma-joined into a single invalid header.
        for (const v of Array.isArray(value) ? value : [value]) {
          appendResponseHeader(event, name, v)
        }
      }
      return response._data
    }
    return
  }

  if (response) {
    event.context.drupalCeCustomPageResponse = {
      _data: response._data,
      headers: headersToRecord(response.headers),
    }
  }
})
