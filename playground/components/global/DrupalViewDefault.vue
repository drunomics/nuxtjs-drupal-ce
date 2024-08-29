<template>
  <div class="view">
    <h1>{{ title }}</h1>
    <component :is="renderCustomElements(row)" v-for="(row, index) in rows" :key="index" />
    <DrupalPagination :total-pages="pager.totalPages" :current="pager.current" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: String;
  rows?: Object[];
  pager?: Object;
}>()

const { renderCustomElements } = useDrupalCe()
</script>
