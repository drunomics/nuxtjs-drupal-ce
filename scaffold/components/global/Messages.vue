<template>
  <div :data-id="$options.name" class="messages">
    <transition-group
      name="list"
      tag="div"
    >
      <message
        v-for="(message, index) in messages"
        :id="`${index}-${message.message}`"
        :key="`${index}-${message.message}`"
        :type="message.type"
        :message="message.message"
        @dismiss="dismiss"
      />
    </transition-group>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Messages',
  computed: {
    ...mapState('drupalCe', ['messages'])
  },
  methods: {
    dismiss (id) {
      this.$store.dispatch('drupalCe/removeMessage', id)
    }
  }
}
</script>

<style lang="css" scoped>
.messages {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 999;
}

.list-enter-active,
.list-leave-active {
  transition: opacity 0.5s;
}

.list-enter,
.list-leave-to {
  opacity: 0;
}
</style>
