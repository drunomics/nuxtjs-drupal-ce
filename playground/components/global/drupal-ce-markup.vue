<template>
  <div>
    <slot>
      <DrupalCeMarkupContainer>
        <component :is="useDrupalCe().renderCustomElements(item)" v-for="item in content" />
      </DrupalCeMarkupContainer>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { compile } from 'vue'

defineSlots<{
  default()
}>()
const props = defineProps<{
  prefix: string
  suffix: string
  content: object[]
}>()
const DrupalCeMarkupContainer = defineComponent({
  setup() {
    return compile(`${props.prefix}<slot></slot>${props.suffix}`)
  },
})
</script>
