import { defineEventHandler, getRequestURL } from 'h3'

/** Answers the query string it received, for the API proxy test. */
export default defineEventHandler(event => ({ query: getRequestURL(event).search }))
