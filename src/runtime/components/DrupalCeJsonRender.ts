import type { PropType, VNode } from 'vue'
import { defineComponent, computed, h } from 'vue'
import { JSONUIProvider, Renderer } from '@json-render/vue'
import { useDrupalCe } from '../composables/useDrupalCe'
import type { JsonRenderSpec, JsonRenderElement } from '../types'

type JsonRenderRegistry = Record<string, unknown>

/**
 * Renders a custom_elements json-render spec via `@json-render/vue`.
 *
 * Registered globally only when the `jsonRender` module option is enabled, so
 * the optional `@json-render/vue` dependency stays out of the bundle
 * otherwise.
 *
 * - Element types resolve through the module's regular custom-element
 *   component resolution, so the same components serve markup, JSON and
 *   json-render rendering.
 * - `drupal-markup` elements carry inline HTML in `props.markup` and render
 *   through the app's `drupal-markup` component (`content` prop).
 * - json-render walks `children` only; the named `slots` of an element are
 *   bridged by rendering each slot entry as a sub-spec rooted at it.
 */
export default defineComponent({
  name: 'DrupalCeJsonRender',
  props: {
    spec: {
      type: Object as PropType<JsonRenderSpec>,
      required: true,
    },
  },
  setup(props) {
    const { resolveCustomElement } = useDrupalCe()

    const makeRegistryComponent = (component: unknown, type: string, spec: JsonRenderSpec, registry: JsonRenderRegistry) => {
      const wrapper = (jsonRenderProps: { element: JsonRenderElement }, context: { slots: Record<string, (() => VNode[]) | undefined> }) => {
        const element = jsonRenderProps.element
        if (type === 'drupal-markup') {
          return h(component as object, { content: element.props?.markup ?? '' })
        }
        const slotFunctions: Record<string, () => VNode | VNode[] | undefined> = {}
        if (context.slots.default) {
          slotFunctions.default = context.slots.default
        }
        Object.entries(element.slots ?? {}).forEach(([slotName, elementKeys]) => {
          slotFunctions[slotName] = () => elementKeys.map(elementKey => h(Renderer, {
            key: elementKey,
            spec: { ...spec, root: elementKey },
            registry,
          }))
        })
        return h(component as object, element.props ?? {}, slotFunctions)
      }
      wrapper.props = ['element', 'emit', 'on', 'bindings', 'loading']
      return wrapper
    }

    const registry = computed<JsonRenderRegistry>(() => {
      const spec = props.spec
      const registry: JsonRenderRegistry = {}
      Object.values(spec.elements).forEach((element) => {
        if (registry[element.type]) {
          return
        }
        const component = resolveCustomElement(element.type)
        if (component) {
          registry[element.type] = makeRegistryComponent(component, element.type, spec, registry)
        }
      })
      return registry
    })

    // The renderer requires its provider contexts; JSONUIProvider bundles
    // them all with defaults.
    return () => h(JSONUIProvider, { registry: registry.value }, {
      default: () => h(Renderer, { spec: props.spec, registry: registry.value }),
    })
  },
})
