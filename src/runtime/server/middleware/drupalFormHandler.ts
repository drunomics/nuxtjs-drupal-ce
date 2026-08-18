import { defineEventHandler, readFormData, setResponseStatus, setResponseHeader } from 'h3'
import { getDrupalBaseUrl, headersToRecord } from '../../composables/useDrupalCe/server'
import { useRuntimeConfig } from '#imports'

/**
 * Response headers that must not be copied verbatim when a proxied Drupal AJAX
 * response is returned. The body is re-serialised on the way out, so a copied
 * content-length / content-encoding would be wrong, and the rest are hop-by-hop.
 */
const AJAX_HOP_BY_HOP_HEADERS = new Set([
  'content-length',
  'content-encoding',
  'transfer-encoding',
  'connection',
  'keep-alive',
])

export default defineEventHandler(async (event) => {
  const { disableFormHandler } = useRuntimeConfig().drupalCe
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
      // Pass the backend response headers through so ajax.js sees the
      // X-Drupal-Ajax-Token verification header (and Set-Cookie), then return
      // the AJAX command payload directly — short-circuiting the SSR render.
      for (const [name, value] of response.headers.entries()) {
        if (!AJAX_HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
          setResponseHeader(event, name, value)
        }
      }
      const setCookies = response.headers.getSetCookie?.() ?? []
      if (setCookies.length > 1) {
        setResponseHeader(event, 'set-cookie', setCookies)
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
