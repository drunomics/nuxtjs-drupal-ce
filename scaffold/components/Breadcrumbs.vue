<template>
  <div class="breadcrumbs">
    <span
      v-for="(crumb, index) in page.breadcrumbs"
      :key="index"
      :url="crumb.url"
    >
      <nuxt-link
        v-if="crumb.url"
        class="crumb"
        :to="crumb.url"
      >
        {{ crumb.label }}
      </nuxt-link>
      <span
        v-else
        class="crumb"
      >
        {{ crumb.label }}
      </span>
    </span>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Breadcrumbs',
  computed: {
    ...mapState('drupalCe', ['page'])
  }
}
</script>

<style lang="css" scoped>
  .breadcrumbs {
    font-size: smaller;
    padding: 1em;
  }
  .crumb {
    margin: 0 0.5em;
    display: inline-flex;
    text-transform: uppercase;
  }
  a:hover {
    text-decoration: underline;
  }
</style>
