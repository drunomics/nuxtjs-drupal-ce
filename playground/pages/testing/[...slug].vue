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
// This component is a work-a-round for bug #293
// see https://github.com/drunomics/nuxtjs-drupal-ce/issues/293
// It is 1:1 the same as the regular [...].vue.

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
