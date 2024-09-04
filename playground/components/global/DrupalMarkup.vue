<template>
  <div v-html="content" />
</template>

<script setup lang="ts">
defineProps<{
  content: string
}>()
</script>
