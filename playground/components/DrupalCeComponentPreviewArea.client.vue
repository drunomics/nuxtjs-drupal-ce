<script setup>
  const previews = useState('drupalCeComponentPreviews', () => [])
</script>

<template>
  <div style="display:none">
    <template v-for="(preview, index) in previews" :key="index">
      <Teleport :to="preview.target">
        <component :is="useDrupalCe().renderCustomElements(preview.content)" />
      </Teleport>
    </template>
  </div>
</template>
