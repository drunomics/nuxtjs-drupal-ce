export default defineEventHandler(() => {
  return {
    redirect: {
      external: false,
      statusCode: 302,
      url: '/node/1'
    },
    messages: []
  }
})
