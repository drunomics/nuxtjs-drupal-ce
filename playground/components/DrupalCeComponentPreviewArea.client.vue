<script setup>
  const previews = useState('drupalCeComponentPreviews', () => [])
</script>

<template>
  <div style="display:none">
    <template v-for="preview in previews" :key="preview.id">
      <Teleport :to="preview.target">
        <component :is="useDrupalCe().renderCustomElements(preview.content)" />
      </Teleport>
    </template>
  </div>
</template>
