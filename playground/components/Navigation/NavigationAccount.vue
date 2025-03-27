<template>
  <ul class="account-menu">
    <li
      v-for="menuItem in accountMenu"
      :key="menuItem.key"
    >
      <a
        class="item"
        :href="menuItem.relative"
      >
        {{ menuItem.title }}
      </a>
    </li>
  </ul>
</template>

<script setup lang="ts">
const accountMenu = await useDrupalCe().fetchMenu('account')
</script>

<style lang="css" scoped>
.account-menu {
  display: inline-flex;
  list-style: none;
}

.item {
  margin: 0 1rem;
  text-decoration: none;
  color: #222;
}
</style>
