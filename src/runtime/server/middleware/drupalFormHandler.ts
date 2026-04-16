import { defineEventHandler, readFormData } from 'h3'
import { getDrupalBaseUrl } from '../../composables/useDrupalCe/server'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const { disableFormHandler } = useRuntimeConfig().drupalCe
  const { ceApiEndpoint, fetchProxyHeaders } = useRuntimeConfig().public.drupalCe

  // Skip API proxy routes - we don't want to handle them here.
  const currentPath = event.node.req.url?.split('?')[0] || ''
  if (currentPath.startsWith('/api/drupal-ce/') || currentPath === '/api/drupal-ce') {
    return
  }

  if (event.node.req.method === 'POST') {
    const routesToBypass = Array.isArray(disableFormHandler) ? disableFormHandler : []

    if (routesToBypass.length) {
      // Remove query parameters from the URL.
      const currentPath = event.node.req.url?.split('?')[0] || '';
      const shouldBypass = routesToBypass.some(route => {
        const routeFormats = [
          route,
          '/api/drupal-ce' + route,
          ceApiEndpoint + route
        ];
        return routeFormats.some(format => format === currentPath);
      });

      if (shouldBypass) {
        return;
      }
    }
    
    const contentType = event.node.req.headers['content-type'] || ''
    if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded') || event.node.req.headers['x-form-processed']) {
      return
    }

    const formData = await readFormData(event)

    if (formData) {
      const targetUrl = event.node.req.url
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
          ...proxyHeaders,
          'x-form-processed': 'true',
        },
      }).catch((error) => {
        event.context.drupalCeCustomPageResponse = {
          error: {
            data: error,
            statusCode: error.statusCode || 400,
            message: error.message || 'Error when POSTing form data (drupalFormHandler).',
          },
        }
      })

      if (response) {
        // Preserve multiple values for the same header (notably set-cookie).
        // Object.fromEntries() would silently keep only the last value, which
        // drops the session cookie when Drupal sets multiple cookies on login.
        const headers: Record<string, string | string[]> = {}
        for (const [key, value] of response.headers.entries()) {
          const existing = headers[key]
          if (existing === undefined) {
            headers[key] = value
          }
          else if (Array.isArray(existing)) {
            existing.push(value)
          }
          else {
            headers[key] = [existing, value]
          }
        }
        event.context.drupalCeCustomPageResponse = {
          _data: response._data,
          headers,
        }
      }
    }
    else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'POST requests without form data are not supported (drupalFormHandler).',
      })
    }
  }
})
