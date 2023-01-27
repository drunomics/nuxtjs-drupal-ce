<template>
  <div>
    <MainNavigation />
    <Breadcrumbs />
    <component :is="useDrupalCeRenderCustomElements(page.content)" />
  </div>
</template>

<script lang="ts" setup>
const page = await useDrupalCeFetchPage(useRoute().path, { query: useRoute().query })

const messages = useDrupalCeMessages()
</script>
