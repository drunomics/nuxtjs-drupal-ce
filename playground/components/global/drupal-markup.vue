<template>
  <slot>
    <div style="display: contents" v-html="content" />
  </slot>
</template>

<script setup lang="ts">
defineProps<{
  /**
   * HTML content to render when no slot content is provided.
   * Required if no default slot content is used.
   */
  content?: string
}>()

// Using display:contents makes this div virtually invisible in the layout
// This mitigates the impact of the wrapping div when rendering the content.
defineSlots<{
  default(): any
}>()
</script>
