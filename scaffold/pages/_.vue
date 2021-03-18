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
  },
  head () {
    return {
      title: this.page.title,
      meta: this.page.metatags.meta,
      link: this.page.metatags.link
    }
  },
  computed: {
    page () {
      return this.$drupal.$currentPage
    }
  }
}
</script>
