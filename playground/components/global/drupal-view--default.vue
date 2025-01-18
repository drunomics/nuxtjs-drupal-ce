<template>
  <div class="view">
    <h1>{{ title }}</h1>
    <component
      :is="renderCustomElements(row)"
      v-for="(row, index) in rows"
      :key="index"
    />
    <DrupalViewsPagination
      :total-pages="pager.totalPages"
      :current="pager.current"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  rows?: object[]
  pager?: object
}>()

const {renderCustomElements} = useDrupalCe()
</script>
