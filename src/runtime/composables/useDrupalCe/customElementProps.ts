import { camelize, defineAsyncComponent, defineComponent, h } from 'vue'
import type { Component, ConcreteComponent } from 'vue'

// A custom element carries a data payload, not HTML attributes. Keys a
// component does not declare as props would fall through to its root element
// and render as non-standard attributes, so they are dropped instead. Global
// HTML attributes, `data-`/`aria-` and event listeners stay: they are valid on
// any element and are how Drupal passes real attributes through.
const DOM_ATTRIBUTE = /^(class|style|id|role|lang|dir|hidden|tabindex|data-.+|aria-.+|on[A-Z].*)$/

// Keyed by the resolved component so a re-render reuses the same wrapper.
// A fresh wrapper on every render would be a new vnode type, remounting the
// whole custom-element subtree.
const wrappers = new WeakMap<object, Component>()

/** Prop names the component declares, camelized like Vue's own prop lookup. */
const declaredProps = (component: ConcreteComponent): Set<string> => {
  const props = (component as { props?: string[] | Record<string, unknown> }).props
  const names = Array.isArray(props) ? props : Object.keys(props ?? {})
  return new Set(names.map(camelize))
}

/** A component rendering `component` with the undeclared keys removed. */
const propFilter = (component: ConcreteComponent): Component => {
  const declared = declaredProps(component)
  const name = (component as { name?: string }).name

  return defineComponent({
    name: name ? `CustomElement:${name}` : 'CustomElement',
    // The payload arrives as `$attrs`, so nothing may fall through untouched.
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      return () => {
        const props: Record<string, unknown> = {}
        const dropped: string[] = []
        for (const key in attrs) {
          if (declared.has(camelize(key)) || DOM_ATTRIBUTE.test(key)) {
            props[key] = attrs[key]
          }
          else {
            dropped.push(key)
          }
        }
        if (import.meta.dev && dropped.length) {
          console.warn(`[nuxtjs-drupal-ce] <${name ?? 'custom element'}> does not declare ${dropped.join(', ')} as props — dropped instead of rendering them as attributes.`)
        }
        return h(component, props, slots)
      }
    },
  })
}

/**
 * Wraps a resolved custom element so it only receives the props it declares.
 *
 * Nuxt registers global components asynchronously, so the declared props are
 * known only once the component has loaded — hence the async wrapper, which
 * suspends exactly like the component it replaces.
 */
export const withDeclaredProps = (component: ConcreteComponent): Component => {
  const cached = wrappers.get(component)
  if (cached) {
    return cached
  }
  const loader = (component as { __asyncLoader?: () => Promise<ConcreteComponent> }).__asyncLoader
  const wrapper = loader
    ? defineAsyncComponent(() => loader().then(propFilter))
    : propFilter(component)
  wrappers.set(component, wrapper)
  return wrapper
}
