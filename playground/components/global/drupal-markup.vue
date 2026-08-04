<template>
  <slot />
  <div v-if="content" v-drupal-markup="content" style="display: contents" />
</template>

<script setup lang="ts">
/**
 * Drupal Markup Component
 *
 * Renders HTML content from Drupal. Content can be passed either via:
 * 1. Default slot (preferred in explicit format)
 * 2. content prop (optional alternative, mainly for backward compatibility)
 *
 * When both are provided, slot is rendered first, then the content prop.
 */
defineProps<{
  content?: string
}>()

// Using display:contents makes this div virtually invisible in the layout
// This mitigates the impact of the wrapping div when rendering the content.
// The markup is applied with v-drupal-markup rather than v-html so that
// hydration adopts the server-rendered DOM instead of recreating it - see the
// directive in nuxtjs-drupal-ce for what that protects.
defineSlots<{
  default(): any
}>()
</script>
