<template>
    <div
      v-if="modal.show"
      :data-id="$options.name"
      :class="[
        'modal window fixed inset-0',
      ]"
      role="document"
      aria-labelledby="modal-content"
      tabindex="0"
      @keyup.esc="dismiss"
      @click="type !== 'overlay' ? dismiss : noop"
    >
      <div
        class="window shadow-2xl rounded-xl overflow-auto bg-base-100 p-8"
        @click.stop
      >
        <header class="flex flex-col header">
          <div class="flex-1 title">
            <slot name="title" />
          </div>
          <div class="text-right actions">
            <slot name="action" />
            <span
              class="modal-dismiss"
              tabindex="0"
              :title="dismissButtonTitle"
              @click="dismiss"
              @keyup.enter="dismiss"
            >
              <slot v-if="$slots['dismiss-icon']" name="dismiss-icon" />
              <span v-else>×</span>
            </span>
          </div>
        </header>
        <div
          id="modal-content"
          class="content"
        >
          <component
            :is="$drupal.contentComponent(modal.content)"
          />
        </div>
      </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'lupus-modal',
  props: {
    dismissButtonTitle: {
      type: String,
      default: 'Close'
    }
  },
  computed: {
    ...mapState('drupalCe', ['modal'])
  },  
  data() {
    return {
      modalRoutes: this.$drupal.options.lupusModal
    }
  },
  mounted() {
    console.log(this.modal)
  },
  methods: {
    dismiss () {
      this.$emit('dismiss')
    },
    noop () {
      // no operation
    }
  }
}
</script>

<style lang="css" scoped>
.modal {
  z-index: 999;
  padding: 2em;
}

.modal:focus {
  outline: none;
}

.modal.overlay,
.modal.overlay-window {
  background: rgba(0, 0, 0, 0.5);
}

.modal.window,
.modal.overlay-window {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.modal.window .window,
.modal.overlay-window .window {
  max-height: calc(100vh - 4em);
  padding: 2em;
  background: white;
}

.modal.window .content,
.modal.overlay-window .content {
  overflow: auto;
}

.modal.overlay {
  color: white;
  overflow: auto;
}

.modal header .title > * {
  margin: 0;
}

</style>
