import type { ObjectDirective } from 'vue'

/**
 * Renders server-delivered HTML that keeps evolving outside of Vue.
 *
 * Drop-in replacement for `v-html` on markup Drupal rendered:
 *
 * ```vue
 * <div v-drupal-markup="content" />
 * ```
 *
 * `v-html` binds `innerHTML`, and hydration re-applies a vnode's bound props
 * over the live DOM (vue >= 3.5.39, vuejs/core#15138). Re-setting `innerHTML`
 * recreates every child node, so everything that happened in the
 * server-rendered DOM before hydration is lost: text a visitor typed into a
 * Drupal form, browser autofill, listeners attached by Drupal libraries,
 * lazy-loading image swaps.
 *
 * `getSSRProps` puts `innerHTML` into the server response only. The client
 * vnode carries no `innerHTML` prop, so hydration has nothing to force-patch
 * and adopts the server-rendered children untouched. Every other behaviour
 * matches `v-html`: a client-side mount renders the markup, a changed binding
 * replaces it, an unchanged re-render leaves the DOM alone.
 *
 * The value is written to `innerHTML` verbatim, exactly like `v-html`. Only
 * pass HTML the server is trusted to produce - nothing is sanitized here.
 *
 * A directive needs a host element, so the markup always lands inside a
 * wrapper element. `style="display: contents"` keeps that wrapper out of the
 * layout.
 */
export const vDrupalMarkup: ObjectDirective<HTMLElement, string | undefined> = {
  getSSRProps(binding) {
    return { innerHTML: binding.value ?? '' }
  },
  beforeMount(el, binding) {
    // `getSSRProps` never runs on the client, so an element mounted without
    // server-rendered DOM - client-side navigation, a form step swapped in
    // after a POST - starts out empty and has to fill itself in. After
    // hydration the element already holds the server-rendered children and is
    // left alone.
    //
    // `beforeMount`, not `mounted`: the write must land during patch, exactly
    // when `v-html` used to write, so the markup already exists when any
    // component's `onMounted` runs. Consumers scan freshly mounted markup for
    // placeholders from `onMounted` (e.g. a captcha teleport) - a `mounted`
    // hook write happens after those scans and before their MutationObservers
    // attach, so it goes unseen.
    if (!el.firstChild) {
      el.innerHTML = binding.value ?? ''
    }
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.innerHTML = binding.value ?? ''
    }
  },
}

declare module 'vue' {
  interface GlobalDirectives {
    vDrupalMarkup: typeof vDrupalMarkup
  }
}
