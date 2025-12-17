<template>
  <div class="canvas-page">
    <slot name="components" />
  </div>
</template>

<script setup lang="ts">
defineSlots<{
  components(): any
}>()
</script>
