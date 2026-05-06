<template>
  <!-- #prefix / #suffix render outside <form> so sibling forms (e.g.
       openid_connect's per-provider buttons) aren't nested. -->
  <slot name="prefix" />
  <form
    :formId="formId"
    :method="method"
    v-bind="attributes"
    :action="useRoute().fullPath"
    class="drupal-form"
  >
    <slot />
  </form>
  <slot name="suffix" />
</template>

<script setup lang="ts">
defineProps<{
  formId: string
  attributes: object
  method: string,
}>()

defineSlots<{
  default(): any
  prefix(): any
  suffix(): any
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
