<template>
  <main role="main">
    <drupal-tabs v-if="page.localTasks" :tabs="page.localTasks" />
    <component :is="$drupal.contentComponent(page.content)" />
  </main>
</template>

<script>
import { mapState } from 'vuex'

export default {
  async asyncData ({ route, $drupal }) {
    // Fill the drupal-ce store with data, but do not return the data here to avoid hydrating data twice.
    await $drupal.fetchPage(route.path)
  },
  head () {
    return {
      title: this.page.title,
      meta: this.page.metatags.meta,
      link: this.page.metatags.link,
      script: [{
        vmid: 'ldjson-schema',
        json: this.page.metatags.jsonld || [],
        type: 'application/ld+json'
      }]
    }
  },
  computed: {
    ...mapState('drupalCe', ['page'])
  }
}
</script>
