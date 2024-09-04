<template>
  <form
    :formId="formId"
    :method="method"
    v-bind="attributes"
    :action="useRoute().fullPath"
    class="drupal-form"
  >
    <slot><div v-html="content" /></slot>
  </form>
</template>

<script setup lang="ts">
defineProps<{
  formId: string
  attributes: object
  method: string
  content?: string
}>()
</script>
