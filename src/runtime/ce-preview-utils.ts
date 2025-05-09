import type { NuxtApp } from 'nuxt/app'

/**
 * Creates a preview of a component using DrupalCE renderCustomElements
 *
 * @param nuxtApp - The initialized Nuxt app instance
 * @param componentName - The name of the component to render
 * @param props - Props to pass to the component
 * @param target - Target element to mount to
 */
export function previewComponent(
  nuxtApp: NuxtApp,
  componentName: string,
  props: Record<string, any>,
  target: string | Element
): void {
  if (!nuxtApp) {
    throw new Error('Missing nuxtApp instance')
  }

  // Use the composable directly with auto-import
  const drupalCe = useDrupalCe()

  if (!drupalCe || !drupalCe.renderCustomElements) {
    throw new Error('DrupalCE renderCustomElements function not found')
  }

  // Get target element
  const mountTarget = typeof target === 'string'
    ? document.querySelector(target)
    : target

  if (!mountTarget) {
    throw new Error(`Target element not found: ${target}`)
  }

  // Create custom element object format for renderCustomElements
  const customElement = {
    element: componentName,
    ...props
  }

  // Use DrupalCE to render the component
  const component = drupalCe.renderCustomElements(customElement)

  if (!component) {
    throw new Error(`Component "${componentName}" could not be rendered`)
  }

  // Mount the component
  const vueConstructor = nuxtApp.vueApp.constructor as any
  const { createApp, h } = vueConstructor
  const app = createApp({
    render: () => h(component)
  })

  app.mount(mountTarget)
}
