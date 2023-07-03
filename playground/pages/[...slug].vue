<template>
  <NuxtLayout :name="page.page_layout">
    <main>
      <Breadcrumbs />
      <DrupalTabs v-if="page.local_tasks" :tabs="page.local_tasks" />
      <component :is="renderCustomElements(page.content)" />
    </main>
  </NuxtLayout>
</template>

<script lang="ts" setup>
const { fetchPage, renderCustomElements } = useDrupalCe()
const page = await fetchPage(useRoute().path, { query: useRoute().query })
definePageMeta({
  layout: false,
})
useHead({
  title: page.value.title,
  meta: page.value.metatags.meta,
  link: page.value.metatags.link,
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(page.value.metatags.jsonld || [], null, ''),
    },
  ],
})
</script>
