export default defineNuxtPlugin(nuxtApp => {
  const previews = useState('drupalCeComponentPreviews', () => [])

  /**
   * Creates a preview of a component and renders it to a target element
   *
   * @param {string} componentName - The name of the registered Vue component
   * @param {Object} props - Props to pass to the component
   * @param {string|Element} target - CSS selector or DOM element where the component will be rendered
   * @returns {Object} An object with unmount method
   */
  function previewComponent(componentName, props, target) {
    const targetEl = typeof target === 'string'
      ? document.querySelector(target)
      : target

    if (!targetEl) {
      throw new Error(`Target element "${target}" not found in DOM`);
    }

    previews.value.push({
      target: targetEl,
      content: {
        element: componentName,
        ...props
      }
    })

    return {
      unmount() {
        previews.value = previews.value.filter(c => c.target !== targetEl)
      }
    }
  }

  nuxtApp.provide('drupalCePreviewComponent', previewComponent)

  onNuxtReady(() => {
    const event = new CustomEvent('nuxt-drupal-ce:ready', {
      detail: { nuxtApp }
    })
    window.dispatchEvent(event)
  })
})
