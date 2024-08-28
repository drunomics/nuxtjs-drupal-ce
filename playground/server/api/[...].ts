export default defineEventHandler((event) => {
  event.node.res.statusCode = 404
  return {
    status: 'error',
    message: 'Not Found'
  }
})
