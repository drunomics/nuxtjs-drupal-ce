export default defineEventHandler((event) => {
  event.node.res.statusCode = 404
  event.node.res.end()
})
