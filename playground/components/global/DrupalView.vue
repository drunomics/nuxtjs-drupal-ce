<template>
  <div class="view">
    <h1>{{ title }}</h1>
    <component v-for="row in rows" :is="renderCustomElements(row)" />
    <DrupalPagination :totalPages="pager.totalPages" :current="pager.current"/>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  title: String;
  rows?: Object[];
  pager?: Object;
}>();

const { renderCustomElements } = useDrupalCe();
</script>
