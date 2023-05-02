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
