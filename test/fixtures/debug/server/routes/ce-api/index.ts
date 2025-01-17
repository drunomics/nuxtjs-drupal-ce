export default defineEventHandler((event) => {
  return { debug: { url: event.node.req.url } }
})
