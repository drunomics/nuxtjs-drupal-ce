<template>
  <div class="canvas">
    <slot name="components" />
  </div>
</template>

<script setup lang="ts">
defineSlots<{
  components(): any
}>()
</script>
