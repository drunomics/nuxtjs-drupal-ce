<template>
  <div class="node">
    <h2 v-if="title">Node: {{ title }}</h2>
    <slot name="image" />
    <slot name="body" />
    <div v-if="$slots.sections">
      <slot name="sections" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  type?: string
  created?: number | string
}>()

defineSlots<{
  image?(): any
  body?(): any
  // The sections slot is for Layout Builder support.
  // When a node uses Layout Builder, the sections are rendered here.
  sections?(): any
}>()
</script>
