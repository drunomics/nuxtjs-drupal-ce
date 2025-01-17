<template>
  <div>
    <NuxtLayout :name="layout">
      <main>
        <SiteBreadcrumbs />
        <DrupalTabs
          v-if="page.local_tasks"
          :tabs="page.local_tasks"
        />
        <component :is="renderCustomElements(page.content)" />
      </main>
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
const { fetchPage, renderCustomElements, usePageHead, getPageLayout } = useDrupalCe()
const page = await fetchPage(useRoute().path, { query: useRoute().query })
const layout = getPageLayout(page)
usePageHead(page)
</script>
