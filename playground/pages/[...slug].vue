<template>
  <div>
    <NuxtLayout :name="layout">
      <main>
        <LazySiteBreadcrumbs v-if="page.breadcrumbs && page.breadcrumbs.length > 0" />
        <LazyDrupalTabs
          v-if="page.local_tasks.primary || page.local_tasks.secondary"
          :tabs="page.local_tasks"
        />
        <component :is="renderCustomElements(page.content)" />
      </main>
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
const { fetchPage, renderCustomElements, getPageLayout } = useDrupalCe()
const page = await fetchPage(useRoute().path, { query: useRoute().query })
// Set to false to support custom layouts, using <NuxtLayout> instead.
definePageMeta({
  layout: false,
})

const layout = getPageLayout(page)

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
