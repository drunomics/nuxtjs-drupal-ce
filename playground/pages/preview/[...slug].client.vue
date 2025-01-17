<script lang="ts">
// Preview route - uses client-side API requests without proxy
// to forward cookies for authenticated preview. Requires CORS helper.

import DefaultPage from '../[...slug].vue'

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
