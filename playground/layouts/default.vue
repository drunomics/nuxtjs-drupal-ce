<template>
  <header>
    <SiteLanguageSwitcher v-if="useNuxtApp().$i18n" />
    <NavigationMain />
  </header>
  <SiteMessages />
  <main id="main">
    <slot />
  </main>
</template>
