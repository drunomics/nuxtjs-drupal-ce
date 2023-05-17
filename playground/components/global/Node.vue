<template>
  <div class="node">
    <h2>Node: {{ title }}</h2>
    <div v-if="body" v-html="body" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: String;
  body?: Array<Object>;
}>()
const { renderCustomElements } = useDrupalCe()
</script>
