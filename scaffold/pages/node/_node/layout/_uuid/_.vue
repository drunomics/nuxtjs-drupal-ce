<template>
  <div>
    <component :is="$drupal.contentComponent(page.content)" />
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  async asyncData ({ route, $drupal }) {
    // Fill the drupal-ce store with data, but do not return the data here to avoid hydrating data twice.
    await $drupal.fetchPage(route.path, { params: route.query })
  },
  computed: {
    ...mapState('drupalCe', ['page'])
  },
  layout: 'layout-builder-block-preview',
}
</script>
