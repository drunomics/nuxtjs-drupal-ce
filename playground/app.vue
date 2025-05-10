<template>
  <DrupalCeComponentPreviewArea v-if="useRuntimeConfig().public.drupalCe.inPreviewMode === true" />
  <NuxtPage v-else />
</template>
