<template>
  <main role="main">
    <drupal-tabs v-if="localTasks" :tabs="localTasks" />
    <component :is="$drupal.contentComponent(content)" />
  </main>
</template>

<script>
import { mapState } from 'vuex'

export default {
  async asyncData ({ route, $drupal }) {
    // Fill the druaplCe store with data.
    await $drupal.fetchPage(route.path)
  },
  head () {
    return {
      title: this.title,
      meta: this.metadata.meta,
      link: this.metadata.link,
      script: [{
        vmid: 'ldjson-schema',
        json: this.metadata.jsonld || [],
        type: 'application/ld+json'
      }]
    }
  },
  computed: {
    ...mapState('drupalCe', [
      'title',
      'content',
      'localTasks',
      'metadata'
    ])
  }
}
</script>
