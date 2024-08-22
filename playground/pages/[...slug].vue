<template>
  <div>
    <NuxtLayout :name="layout">
      <main>
        <SiteBreadcrumbs />
        <DrupalTabs v-if="page.local_tasks" :tabs="page.local_tasks" />
        <component :is="renderCustomElements(page.content)" />
      </main>
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
const { fetchPage, renderCustomElements } = useDrupalCe();
const page = await fetchPage(useRoute().path, { query: useRoute().query });
// Set to false to support custom layouts, using <NuxtLayout> instead.
definePageMeta({
  layout: false,
});
const layout = computed(() => {
  return page.value.page_layout || "default";
});
useHead({
  title: page.value.title,
  meta: page.value.metatags.meta,
  link: page.value.metatags.link,
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify(page.value.metatags.jsonld || [], null, ""),
    },
  ],
});
</script>
