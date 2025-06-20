<template>
  <div class="node">
    <h2 v-if="title">Node: {{ title }}</h2>
    <slot name="image">
      <component :is="useDrupalCe().renderCustomElements(image)" />
    </slot>
    <slot name="body">
      <component :is="useDrupalCe().renderCustomElements(body)" />
    </slot>
    <div v-if="sections">
      <component :is="useDrupalCe().renderCustomElements(sections)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CustomElementContent } from 'nuxtjs-drupal-ce'

defineSlots<{
  body(): any
  image(): any
}>()

defineProps<{
  title?: string;
  type?: string;
  created?: number | string;
  /**
   * Custom elements content to render.
   * Required if no default slot content is used.
   */
  sections?: CustomElementContent; // Layout-builder support.
  image?: CustomElementContent;
  body?: CustomElementContent;
}>()
</script>
