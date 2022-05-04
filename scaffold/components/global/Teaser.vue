<template>
  <div :data-id="$options.name">
    <h3>
      {{ title | decodeSpecialChars }}
    </h3>
    <p>
      {{ excerpt | decodeSpecialChars }}
    </p>
  </div>
</template>

<script>
export default {
  name: 'Teaser',
  props: {
    title: {
      default: '',
      type: String
    },
    excerpt: {
      default: '',
      type: String
    }
  }
}
</script>
