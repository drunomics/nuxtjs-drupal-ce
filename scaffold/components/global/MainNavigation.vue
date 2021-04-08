<template>
  <ul class="main-menu">
    <li
      v-for="menuItem in menus.main"
      :key="menuItem.key"
    >
      <nuxt-link
        v-if="!menuItem.external"
        class="item"
        :to="'/' + menuItem.alias"
        v-text="menuItem.title"
      />
      <a
        v-else
        class="item"
        :href="menuItem.absolute"
        v-text="menuItem.title"
      />
    </li>
  </ul>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'MainNavigation',
  computed: {
    ...mapState('drupalCe', ['menus'])
  }
}
</script>

<style lang="css" scoped>
.main-menu {
  display: flex;
  list-style: none;
}

.item {
  margin: 0 1rem;
  text-decoration: none;
  color: #222;
}

.nuxt-link-active {
  border-bottom: 2px solid aquamarine;
}
</style>
