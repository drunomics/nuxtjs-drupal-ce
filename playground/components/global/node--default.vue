<template>
  <div class="node">
    <h2>Node: {{ title }}</h2>
    <div
      v-if="image"
      v-html="image.content"
    />
    <div
      v-if="body"
      v-html="body"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  type: string
  created: number | string
  body?: string[]
  image?: object
}>()
</script>
