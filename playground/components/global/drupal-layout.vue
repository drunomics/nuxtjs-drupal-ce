<template>
  <div
    class="layout-section"
  >
    <div v-if="content">
      <component :is="renderCustomElements(content)" />
    </div>
    <div v-if="first">
      <component :is="renderCustomElements(first)" />
    </div>
    <div v-if="second">
      <component :is="renderCustomElements(second)" />
    </div>
    <div v-if="third">
      <component :is="renderCustomElements(third)" />
    </div>
    <div v-if="fourth">
      <component :is="renderCustomElements(fourth)" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { renderCustomElements } = useDrupalCe()

defineProps<{
  layout: string;
  settings: object;
  content?: CustomElementContent;
  first?: CustomElementContent;
  second?: CustomElementContent;
  third?: CustomElementContent;
  fourth?: CustomElementContent;
}>()
</script>
