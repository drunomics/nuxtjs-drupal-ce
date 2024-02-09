<template>
  <div>
    <div>
      {{ page.debug?.url }}
    </div>
  </div>
</template>

<script lang="ts" setup>
const { fetchPage } = useDrupalCe()
const { page } = await fetchPage(useRoute().path, { query: useRoute().query })
</script>
