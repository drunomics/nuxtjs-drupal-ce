import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(async (nuxtApp) => {
  const { getPage } = useDrupalCe()
  const { passThroughHeaders } = useRuntimeConfig().public.drupalCe
  const page = await getPage()
  nuxtApp.hook('app:rendered', (ctx) => {
    if (page.value.headers) {
      Object.keys(page.value.headers).forEach((key) => {
        if (passThroughHeaders.includes(key)) {
          ctx.ssrContext?.event.node.res.setHeader(key, page.value.headers[key])
        }
      })
    }
  })
})
