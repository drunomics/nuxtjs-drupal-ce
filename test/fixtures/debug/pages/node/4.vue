<template>
  <component :is="renderCustomElements(page.content)" />
</template>

<script lang="ts" setup>
const { fetchPage, renderCustomElements } = useDrupalCe()
const page = await fetchPage(useRoute().path, { query: useRoute().query })
</script>
