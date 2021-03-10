<template>
  <main role="main">
    <drupal-tabs v-if="page.localTasks" :tabs="page.localTasks" />
    <component :is="$drupal.contentComponent()" />
  </main>
</template>

<script>

export default {
  async asyncData ({ route, $drupal }) {
    // Do not return the data here to avoid hydrating data twice. The drupal-ce module is taking care of it already.
    await $drupal.fetchPage(route.path)
    return { }
  },
  computed: {
    page () {
      return this.$drupal.$currentPage
    }
  },
  head () {
    return {
      title: this.page.title,
      meta: this.page.metadata.meta,
      link: this.page.metadata.link
    }
  }
}
</script>
