export default defineEventHandler(event => ({
  title: getRouterParam(event, 'path'),
  content: {},
}))
