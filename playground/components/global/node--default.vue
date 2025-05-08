<template>
  <div class="node">
    <h2 v-if="title">Node: {{ title }}</h2>
    <slot name="image">
      <component :is="useDrupalCe().renderCustomElements($attrs.image)" />
    </slot>
    <slot name="body">
      <component :is="useDrupalCe().renderCustomElements($attrs.body)" />
    </slot>
    <div v-if="sections">
      <h2>here</h2>
      <component :is="useDrupalCe().renderCustomElements(sections)" />
    </div>
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
  sections?: object[];
}>()
</script>