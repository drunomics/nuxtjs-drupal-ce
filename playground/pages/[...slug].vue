<template>
  <NuxtLayout :name="layout">
    <LazySiteBreadcrumbs />
    <LazyDrupalTabs
      v-if="page.local_tasks"
      :tabs="page.local_tasks"
    />
    <component :is="renderCustomElements(page.content)" />
  </NuxtLayout>
</template>

<script lang="ts" setup>
const { fetchPage, renderCustomElements, usePageHead, getPageLayout } = useDrupalCe()
const page = await fetchPage(useRoute().path, { query: useRoute().query })
const layout = getPageLayout(page)
usePageHead(page)
</script>
