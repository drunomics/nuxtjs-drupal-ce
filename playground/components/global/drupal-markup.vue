<template>
  <div>
    <slot>
      <component :is="useDrupalCe().renderCustomElements($attrs.content)" />
    </slot>
  </div>
</template>

<script setup lang="ts">
defineSlots<{
  default();
}>()
</script>
