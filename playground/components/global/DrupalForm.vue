<template>
  <form :formId="formId" :method="method" v-bind="attributes" :action="useRoute().fullPath" class="drupal-form">
    <slot><div v-html="content" /></slot>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  formId: String,
  attributes: Object,
  method: String,
  content?: String,
}>()
</script>
