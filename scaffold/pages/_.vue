<template>
  <main role="main">
    <drupal-tabs v-if="page.localTasks" :tabs="page.localTasks" />
    <component :is="$drupal.contentComponent()" />
  </main>
</template>

<script>

export default {
  async asyncData ({ route, $drupal }) {
    return { page: await $drupal.fetchPage(route.path) }
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
