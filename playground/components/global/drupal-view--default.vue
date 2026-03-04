<template>
  <div class="view">
    <h1>{{ title }}</h1>
    <div v-if="slots.header" class="view-header">
      <slot name="header" />
    </div>
    <component :is="rowsWrapper" class="view-rows">
      <slot name="rows" />
    </component>
    <div v-if="slots.empty" class="view-empty">
      <slot name="empty" />
    </div>
    <DrupalViewsPagination
      v-if="pager.totalPages"
      :total-pages="pager.totalPages"
      :current="pager.current"
    />
    <div v-if="slots.footer" class="view-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineSlots<{
  rows(): any,
  header(): any,
  footer(): any,
  empty(): any,
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

const slots = useSlots();
</script>
