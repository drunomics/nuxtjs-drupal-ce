<template>
  <div :data-id="$options.name">
    <h2>
      {{ title | decodeSpecialChars }}
    </h2>
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
