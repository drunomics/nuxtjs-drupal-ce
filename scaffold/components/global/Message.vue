<template>
  <div
    :class="['message', type]"
    @click="dismiss"
  >
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="message" />
  </div>
</template>

<script>
export default {
  name: 'Message',
  props: {
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
  },
  mounted () {
    setTimeout(() => this.dismiss(), 5000)
  },
  methods: {
    dismiss () {
      this.$emit('dismiss', this.id)
    }
  }
}
</script>

<style lang="postcss" scoped>
.message {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
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
