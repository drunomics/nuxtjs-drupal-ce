<template>
  <div>
    <SiteLanguageSwitcher v-if="useNuxtApp().$i18n" />
    <NavigationMain />
    <SiteMessages />
    <div id="main">
      <slot />
    </div>
  </div>
</template>
