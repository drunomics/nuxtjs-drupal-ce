<template>
  <div>
    <component :is="useRenderCustomElements(page.content)" v-if="page && page.content" />
  </div>
</template>

<script lang="ts" setup>
import { useDrupalCeFetchPage, useRoute, useRenderCustomElements } from '#imports'

const page = await useDrupalCeFetchPage(useRoute().path)
</script>
