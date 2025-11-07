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

definePageMeta({
  // Use fullPath minus hash for cache key to ensure:
  // - Different query params (e.g., ?page=2) create separate cache entries
  // - Hash fragments (e.g., #gallery--slide--1) don't affect caching
  // - Components can watch route.hash for transient UI state
  key: (route) => route.fullPath.split('#')[0],
})
</script>
