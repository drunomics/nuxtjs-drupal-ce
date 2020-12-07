#!/usr/bin/env node
const fs = require('fs')

const fileContent = `
<template>
  <main role="main">
    <drupal-tabs v-if="page.localTasks" :tabs="page.localTasks" />
    <component :is="$drupal.contentComponent()" />
  </main>
</template>

<script>
import { DrupalTabs } from 'components/Drupal'

export default {
  name: 'PageDefault',
  components: {
    DrupalTabs
  },
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
`
const basePath = ''
// The absolute path of the new file with its name
const filepath = basePath + '_.vue'

fs.writeFile(filepath, fileContent, (err) => {
  if (err) { throw err }
})
