<script lang="ts">
// This route works like default page route, but it ensures that
// it works with the backend login of the user previewing changes.

// By default, backend and frontend do not share the same cookie domain.
// Still, we apply the backend cookie by making sure that the Drupal-API request
// is done client-side and without API-proxy, such that the cookie is forwarded by
// the browser. It requires the CORS helper module to be enabled.

import DefaultPage from '../../[...slug].vue'

export default {
  extends: DefaultPage,
  async setup() {
    const { fetchPage, renderCustomElements, usePageHead, getPageLayout } = useDrupalCe()
    const page = await fetchPage(useRoute().path, {
      query: useRoute().query,
    }, undefined, true)

    const layout = getPageLayout(page)
    usePageHead(page)

    return {
      page,
      layout,
      renderCustomElements,
    }
  },
}
</script>
