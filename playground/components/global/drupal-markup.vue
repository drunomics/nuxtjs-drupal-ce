<template>
  <slot>
    <component :is="useDrupalCe().renderCustomElements($attrs.content)" />
  </slot>
</template>

<script setup lang="ts">
defineSlots<{
  default();
}>()
</script>
