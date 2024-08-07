<template>
  <form vue-enabled :formId="formId" :method="method" v-bind="attributes" :action="target">
    <slot><div v-html="content" /></slot>
    <input type="hidden" name="target_url" :value="target">
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  formId: String,
  attributes: Object,
  method: String,
  content?: String,
}>()

const match = props.content ? props.content.match(/action="([^"]*)"/) : null
const target = match ? match[1] : useRoute().path
</script>
