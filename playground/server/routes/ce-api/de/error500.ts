export default defineEventHandler((event) => {
  event.node.res.statusCode = 500
  event.node.res.end()
})
