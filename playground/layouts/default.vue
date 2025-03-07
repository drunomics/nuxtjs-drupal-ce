<template>
  <header>
    <SiteLanguageSwitcher v-if="useNuxtApp().$i18n" />
    <NavigationMain />
  </header>
  <SiteMessages />
  <main id="main">
    <slot />
  </main>
  <footer>
    <NavigationAccount />
  </footer>
</template>

<style>
#main {
  min-height: 70vh;
}
body {
  background-color: white;
}
</style>
