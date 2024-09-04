<template>
  <div class="language-switcher">
    <div
      v-for="availableLocale in availableLocales"
      :key="availableLocale"
    >
      <a
        v-if="alternateLinkPath(availableLocale)"
        :href="alternateLinkPath(availableLocale)"
        :class="{ 'active-locale': availableLocale === locale }"
        @click="setLocale(availableLocale)"
      >
        {{ availableLocale }}
      </a>
      <div
        v-else
      >
        {{ availableLocale }}
      </div>
    </div>
  </div>
</template>

<script setup>
const { locale, locales, setLocale } = useI18n()
const { getPage } = useDrupalCe()

const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})

// Get the path of the translated page from the 'alternate' link in the metatags.
const alternateLinkPath = (langCode) => {
  const alternateLink = getPage().value.metatags.link.find(link => link.rel === 'alternate' && link.hreflang === langCode)
  if (!alternateLink) {
    return
  }
  const alternateLinkURL = new URL(alternateLink.href)
  return alternateLinkURL.pathname
}
</script>

<style lang="css" scoped>
.language-switcher {
  display: inline-flex;
  background-color: #f8f8f8;
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin-left: 1rem;
  list-style: none;
}

a {
  font-size: 1rem;
  padding: 0.5rem;
  text-decoration: none;
  text-transform: uppercase;
  color: #222;
}

.active-locale {
  border-bottom: 2px solid black;
}
</style>
