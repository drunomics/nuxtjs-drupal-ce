<template>
  <div :data-id="$options.name">
    <lupus-link
      v-bind="$attrs"
      :target="target"
      :href="href"
      class="block py-4 rounded-lg md:py-6 hover:shadow-lg text-base-content hover:text-base-content md:hover:bg-base-200"
    >
      <div class="flex flex-row">
        <lupus-image v-bind="image" class="w-32 ml-1 md:mx-8 sm:w-48 md:w-56" />
        <div class="flex-1 ml-4 md:ml-0 md:mr-8">
          <h2 class="mb-2 text-lg leading-tight break-words font-display md:text-2xl line-clamp-3 md:line-clamp-2">
            {{ title | decodeSpecialChars }}
          </h2>
          <div class="hidden mt-0 tracking-wide c-excerpt opacity-90 sm:block sm:line-clamp-4">
            {{ excerpt | decodeSpecialChars }}
          </div>
          <teaser-meta v-bind="{category, publishedAt}" class="mt-2" />
        </div>
      </div>
      <div class="mt-3 text-sm leading-6 tracking-wide opacity-90 sm:hidden line-clamp-4">
        {{ excerpt | decodeSpecialChars }}
      </div>
    </lupus-link>
  </div>
</template>

<script>
import AnchorTag from '~/mixins/anchorTag'
import teaserProps from '~/mixins/teaserProps'

export default {
  name: 'teaser-wide',
  mixins: [
    AnchorTag,
    teaserProps
  ],
  inheritAttrs: false
}
</script>

<style lang="postcss">
/* Define a wrapper behavior for TeaserList */
.teasers--teaser-wide {
  @apply mx-auto max-w-6xl divide-base-200 divide-y;
}
</style>
