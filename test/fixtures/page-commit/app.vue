<script setup>
const current = useDrupalCe().getPage()
</script>

<template>
  <div>
    <p id="shared-title">{{ current.title }}</p>
    <NuxtLink to="/origin">Origin</NuxtLink>
    <NuxtLink to="/slow">Slow</NuxtLink>
    <NuxtLink to="/fast">Fast</NuxtLink>
    <NuxtPage :keepalive="{ max: 5 }" />
  </div>
</template>
