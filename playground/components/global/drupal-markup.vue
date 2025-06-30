<template>
  <slot>
    <div style="display: contents" v-html="content" />
  </slot>
</template>

<script setup lang="ts">
defineProps<{
  content?: CustomElementContent
}>()

// Using display:contents makes this div virtually invisible in the layout
// This mitigates the impact of the wrapping div when rendering the content.
defineSlots<{
  default(): any
}>()
</script>
