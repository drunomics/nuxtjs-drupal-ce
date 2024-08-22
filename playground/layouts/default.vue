<template>
  <div>
    <SiteLanguageSwitcher v-if="$i18n" />
    <NavigationMain />
    <SiteMessages />
    <div id="main">
      <slot />
    </div>
  </div>
</template>
