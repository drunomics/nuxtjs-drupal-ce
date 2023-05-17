<template>
  <div v-html="content" />
</template>

<script setup lang="ts">
const props = defineProps<{
  content: String;
}>()
</script>
