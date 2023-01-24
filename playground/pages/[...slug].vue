<template>
  <div>
    <MainNavigation />
    <Breadcrumbs />
    <component :is="useDrupalCeRenderCustomElements(page.content)" />
  </div>
</template>

<script lang="ts" setup>
const page = await useDrupalCeFetchPage(useRoute().path)
useState(`page-${useRoute().path}`, () => page)

const messages = useDrupalCeMessages()
</script>
