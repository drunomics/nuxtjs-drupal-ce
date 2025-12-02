<template>
  <ComponentPreviewArea v-if="useRuntimeConfig().public.componentPreview" />
  <NuxtPage v-else :keepalive="{ max: 5 }" />
</template>
