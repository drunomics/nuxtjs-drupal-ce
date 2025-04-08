/**
 * DrupalCeContainer Component
 *
 * A component that serves as a container for rendering Drupal custom elements.
 * Supports two modes of operation:
 *
 * 1. Slot Mode - Using Vue slots for content
 * 2. JSON Mode - Using content prop with array of elements
 *
 * @example Slot Mode Usage:
 * ```vue
 * <DrupalCeContainer tag="div" class="foo">
 *   <template #default>
 *     <drupal-markup>Cell content before embed</drupal-markup>
 *     <drupal-media id="123">Some example embedded element.</drupal-media>
 *     <drupal-markup>Cell content after embed</drupal-markup>
 *   </template>
 * </DrupalCeContainer>
 * ```
 *
 * @example JSON Mode Usage:
 * ```vue
 * <DrupalCeContainer
 *   tag="div"
 *   class="foo"
 *   :content="[
 *     {
 *       'element': 'drupal-markup',
 *       'content': 'Cell content before embed'
 *     },
 *     {
 *       'element': 'drupal-media',
 *       'id': '123',
 *       'content': 'Some example embedded element.'
 *     },
 *     {
 *       'element': 'drupal-markup',
 *       'content': 'Cell content after embed'
 *     }
 *   ]"
 * />
 * ```
 */

import { h, defineComponent } from 'vue';
import type { VNode } from 'vue';
// useDrupalCe is auto-imported by Nuxt

export default defineComponent({
  name: 'DrupalCeContainer',

  props: {
    /**
     * HTML tag to use for the container
     * @default 'div'
     */
    tag: {
      type: String,
      default: 'div'
    },

    /**
     * Array of custom elements to render (for JSON mode)
     * Each element should have an 'element' property defining the component type
     * @optional
     */
    content: {
      type: Array,
      default: null
    }
  },

  /**
   * @slot default - Content slot for custom elements in Slot mode
   */

  render(): VNode {
    // useDrupalCe is auto-imported by Nuxt
    const { renderCustomElements } = useDrupalCe();

    // Determine which mode we're in - slot mode or JSON mode
    const isJsonMode = Array.isArray(this.content);

    // Get all props except 'tag', 'content', and 'element' to pass to the container
    const containerProps = { ...this.$attrs };

    // Remove 'element' attribute to prevent it from being passed to the DOM
    if ('element' in containerProps) {
      delete containerProps.element;
    }

    let children;

    if (isJsonMode && this.content) {
      // JSON mode - render each element in the content array
      children = this.content.map(item => renderCustomElements(item));
    } else if (this.$slots.default) {
      // Slot mode - use the default slot content
      children = this.$slots.default();
    } else {
      // No content
      children = [];
    }

    // Render the container with the appropriate tag and children
    return h(this.tag, containerProps, children);
  }
});
