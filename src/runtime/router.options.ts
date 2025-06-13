import type { RouterConfig } from '@nuxt/schema'
import { createMemoryHistory } from 'vue-router'

export default <RouterConfig>{
  // Only change history mode on client and in about:srcdoc iframe to avoid SSR issues
  history: (base) => {
    if (import.meta.client && typeof window !== 'undefined' && window.location.href === 'about:srcdoc') {
      // [Drupal CE] Detected about:srcdoc iframe - using memory history
      console.log('[Drupal CE] Detected about:srcdoc iframe - using memory history')
      return createMemoryHistory(base)
    }
    // Use Nuxt's default history otherwise (no return statement lets Nuxt handle it)
  }
}
