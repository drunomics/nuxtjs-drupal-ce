<template>
  <div>
    <LanguageSwitcher v-if="$i18n" />
    <MainNavigation />
    <Messages />
    <div id="main">
      <slot />
    </div>
  </div>
</template>
