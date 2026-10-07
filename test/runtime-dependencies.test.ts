// @vitest-environment node
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { describe, expect, it } from 'vitest'

describe('runtime dependencies', () => {
  it('owns the H3 dependency used to forward Nitro response headers', () => {
    const manifestUrl = new URL('../package.json', import.meta.url)
    const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'))
    // A hoisted H3 2 can otherwise satisfy this undeclared import while
    // Nuxt 4 still supplies an H3 1 event, breaking page SSR.
    expect(manifest.dependencies.h3).toBeDefined()

    const require = createRequire(manifestUrl)
    const { createEvent, appendResponseHeader } = require('h3')
    const request = new IncomingMessage(new Socket())
    const response = new ServerResponse(request)
    const event = createEvent(request, response)
    appendResponseHeader(event, 'cache-tag', 'node:1')
    appendResponseHeader(event, 'cache-tag', 'node:2')
    expect(response.getHeader('cache-tag')).toEqual(['node:1', 'node:2'])
  })
})
