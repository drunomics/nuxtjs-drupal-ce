import type { RouterConfig } from '@nuxt/schema'
import { createMemoryHistory, createWebHistory } from 'vue-router'

export default <RouterConfig> {
  history: (base) => {
    // Use memory history for about:srcdoc iframes to prevent SecurityError.
    if (process.client && window.location.href === 'about:srcdoc') {
      console.log('[Drupal CE] Detected about:srcdoc iframe - using memory history')
      return createMemoryHistory(base)
    }

    return createWebHistory(base)
  }
}
