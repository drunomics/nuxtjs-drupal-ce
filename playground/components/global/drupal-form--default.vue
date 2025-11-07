<template>
  <form
    :formId="formId"
    :method="method"
    v-bind="attributes"
    :action="useRoute().fullPath"
    class="drupal-form"
  >
    <slot>
      <component :is="useDrupalCe().renderCustomElements(content)" />
    </slot>
  </form>
</template>

<script setup lang="ts">
defineProps<{
  formId: string
  attributes: object
  method: string,
  content?: CustomElementContent
}>()

defineSlots<{
  default(): any
}>()
</script>

<style>
form {
  padding: 0 1rem;
}

label {
  display: block;
  margin-bottom: 0.325rem;
}

input {
  max-width: 90%;
  padding: 0.5rem;
  margin-bottom: 0.75rem;
}
</style>
