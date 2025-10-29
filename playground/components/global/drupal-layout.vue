<template>
  <div
    class="layout-section"
  >
    <div v-if="$slots.default">
      <slot />
    </div>
    <div v-if="$slots.first">
      <slot name="first" />
    </div>
    <div v-if="$slots.second">
      <slot name="second" />
    </div>
    <div v-if="$slots.third">
      <slot name="third" />
    </div>
    <div v-if="$slots.fourth">
      <slot name="fourth" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  layout: string
  settings: object
}>()

defineSlots<{
  default?(): any
  first?(): any
  second?(): any
  third?(): any
  fourth?(): any
}>()
</script>
