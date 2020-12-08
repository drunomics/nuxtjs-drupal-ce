<template>
  <div class="node">
    <h2>{{ title }}</h2>
    <slot name="default" />
  </div>
</template>

<script>
export default {
  props: {
    title: String
  }
}
</script>
