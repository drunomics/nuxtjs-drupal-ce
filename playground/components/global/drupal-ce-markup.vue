<template>
  <div>
    <slot>
      <DrupalCeMarkupWrapper>
        <component :is="useDrupalCe().renderCustomElements($attrs.content)" />
      </DrupalCeMarkupWrapper>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { compile } from 'vue'

defineSlots<{
  default()
}>()
const props = withDefaults(defineProps<{
  prefix?: string
  suffix?: string
}>(), {
  prefix: '',
  suffix: '',
})
const DrupalCeMarkupWrapper = defineComponent({
  setup() {
    return compile(`${props.prefix}<slot></slot>${props.suffix}`)
  },
})
</script>
