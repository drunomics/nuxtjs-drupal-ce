export default defineEventHandler(() => {
  return {
    redirect: {
      external: false,
      statusCode: 302,
      url: '/de/node/1',
    },
    messages: [],
  }
})
