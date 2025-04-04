<template>
  <slot>
    <div style="display: contents" v-html="$attrs.content"></div>
  </slot>
</template>

<script setup lang="ts">
// Using display:contents makes this div virtually invisible in the layout
// This mitigates the impact of the wrapping div when rendering the content.
defineSlots<{
  default();
}>()
defineOptions({
  inheritAttrs: false
})
</script>
