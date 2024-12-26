<template>
  <div class="node">
    <h2 v-if="title">Node: {{ title }}</h2>

  </div>
</template>

<script setup lang="ts">
defineSlots<{
  body();
  image();
}>()
defineProps<{
  title?: string;
  type?: string;
  created?: number | string;
  // Layout-builder support.
  sections?: object;
}>()
</script>
