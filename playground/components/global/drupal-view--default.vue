<template>
  <div class="view">
    <h1>{{ title }}</h1>
    <component :is="rowsWrapper" class="view-rows">
      <slot name="rows" />
    </component>
    <DrupalViewsPagination
      v-if="pager.totalPages"
      :total-pages="pager.totalPages"
      :current="pager.current"
    />
  </div>
</template>

<script setup lang="ts">
defineSlots<{
  default(): any,
}>();

const props = withDefaults(defineProps<{
  title: string,
  viewId: string,
  displayId: string,
  rowsWrapper: string,
  pager: {
    totalPages?: number,
    current?: number,
    itemsPerPage?: number,
    totalItems?: number,
  };
}>(), {
  rowsWrapper: 'div',
  pager: () => ({}),
});
</script>
