<template>
  <div>
    <MainNavigation />
    <component :is="useDrupalCeRenderCustomElements(page.content)" v-if="page && page.content" />
  </div>
</template>

<script lang="ts" setup>
import {
  useDrupalCeFetchPage,
  useRoute,
  useDrupalCeRenderCustomElements,
  useState,
} from '#imports'

const page = await useDrupalCeFetchPage(useRoute().path)
useState(`page-${useRoute().path}`, () => page)
</script>
