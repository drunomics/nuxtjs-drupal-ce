<template>
  <div
    :class="['message', type]"
    @click="dismiss"
  >
    <div v-html="message" />
  </div>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: type => ['error', 'success'].includes(type)
  },
  id: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['dismiss'])

onMounted(() => {
  setTimeout(() => dismiss(), 5000)
})

const dismiss = () => emit('dismiss', props.id)
</script>

<style lang="postcss" scoped>
.message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: white;
  cursor: pointer;
}

.message.error {
  background-color: crimson;
}

.message.success {
  background-color: rebeccapurple;
}
</style>
