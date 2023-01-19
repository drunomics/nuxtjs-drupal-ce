<template>
  <div v-html="content">
  </div>
</template>

<script>
export default {
  props: {
    content: {
      type: String,
      required: true
    },
  }
}
</script>
