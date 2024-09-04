<template>
  <div
    :data-id="$options.name"
    class="messages"
  >
    <transition-group
      name="list"
      tag="div"
    >
      <SiteMessage
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

<script setup lang="ts">
const { getMessages } = useDrupalCe()
const messages = getMessages()
const dismiss = (id: number) => messages.value.splice(id, 1)
</script>

<style lang="css" scoped>
.messages {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
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
