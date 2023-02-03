<template>
  <div>
    <MainNavigation />
    <Breadcrumbs />
    <component :is="renderCustomElements(page.content)" />
  </div>
</template>

<script lang="ts" setup>
const { fetchPage, getMessages, renderCustomElements } = useDrupalCe()
const page = await fetchPage(useRoute().path, { query: useRoute().query })
const messages = getMessages()
</script>
