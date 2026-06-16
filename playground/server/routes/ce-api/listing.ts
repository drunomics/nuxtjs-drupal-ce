import { defineEventHandler, getQuery } from 'h3'

/**
 * A paginated listing whose SSR output varies by the `page` query parameter
 * and ignores client-only params (e.g. `track`). Mirrors a Drupal view: the
 * CDN varies its cache key on `page` but strips tracking params, so the HTML
 * rendered for `?page=2` is served to `?page=2&track=1`, and the HTML for the
 * unparametrized listing is served to `?track=1`.
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  return {
    title: 'Listing',
    messages: [],
    breadcrumbs: [],
    metatags: {
      meta: [{ name: 'title', content: 'Listing | lupus decoupled' }],
      link: [],
    },
    content_format: 'json',
    content: {
      element: 'drupal-markup',
      content: `Listing items — page ${page}`,
    },
    page_layout: 'default',
    local_tasks: [],
  }
})
