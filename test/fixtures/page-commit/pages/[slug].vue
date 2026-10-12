<script setup>
const route = useRoute()
const page = await useDrupalCe().fetchPage(route.path)
if (import.meta.client && route.path === '/slow') {
  // Hold Suspense after the API resolves, using a deterministic test gate.
  await new Promise((resolve) => { window.releaseSlowPage = resolve })
}
definePageMeta({ key: route => route.path })
</script>

<template>
  <h1 id="page-title">{{ page.title }}</h1>
</template>
