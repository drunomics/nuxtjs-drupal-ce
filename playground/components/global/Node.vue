<template>
  <div class="node">
    <h2>Node: {{ title }}</h2>
    <div v-if="body" v-html="body" />
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    body: {
      type: [Array, String],
      default: ''
    }
  }
}
</script>
