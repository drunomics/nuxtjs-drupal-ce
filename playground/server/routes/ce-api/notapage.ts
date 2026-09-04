import { eventHandler, setResponseHeader, setResponseStatus } from 'h3'

// Drupal answers an asset-like path — /apple-touch-icon.png, a retired service
// worker — with a 404 that carries no CE page structure, but is cacheable all
// the same.
export default eventHandler((event) => {
  setResponseStatus(event, 404)
  setResponseHeader(event, 'cache-control', 'max-age=60, public, s-maxage=86400')
  return { message: 'Not Found' }
})
