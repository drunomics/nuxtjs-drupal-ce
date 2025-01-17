<template>
  <form
    :formId="formId"
    :method="method"
    v-bind="attributes"
    :action="useRoute().fullPath"
    class="drupal-form"
  >
    <slot>
      <component :is="useDrupalCe().renderCustomElements($attrs.content)" />
    </slot>
  </form>
</template>

<script setup lang="ts">
defineProps<{
  formId: string
  attributes: object
  method: string
}>()
defineSlots<{
  default();
}>()
</script>
