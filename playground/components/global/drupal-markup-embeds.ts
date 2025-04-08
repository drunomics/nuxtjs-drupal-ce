/**
 * DrupalMarkupEmbeds Component
 *
 * A component that renders HTML markup with embedded custom elements.
 * Supports two modes of operation:
 *
 * 1. Slot Mode - Using Vue slots for content and embeds
 * 2. JSON Mode - Using props for content and embeds
 *
 * @example Slot Mode Usage:
 * ```vue
 * <DrupalMarkupEmbeds>
 *   <template #default>
 *     <div>Main content with <div data-ce-embed="my-embed"></div> placeholder</div>
 *   </template>
 *   <template #ce-embed-my-embed>
 *     <MyComponent>This replaces the placeholder</MyComponent>
 *   </template>
 * </DrupalMarkupEmbeds>
 * ```
 *
 * @example JSON Mode Usage:
 * ```vue
 * <DrupalMarkupEmbeds
 *   content="<div>Main content with <div data-ce-embed=\"my-embed\"></div> placeholder</div>"
 *   :ce-embed-my-embed="{ element: 'my-component', prop: 'value' }"
 * />
 * ```
 */

import { h, Fragment, defineComponent } from 'vue';
import type { VNode } from 'vue';
// useDrupalCe is auto-imported by Nuxt

export default defineComponent({
  name: 'DrupalMarkupEmbeds',

  inheritAttrs: false, // Prevent attributes from being passed to the root element

  props: {
    /**
     * HTML content with embed placeholders (for JSON mode)
     * When provided, the component operates in JSON mode
     * Embeds are specified as <div data-ce-embed="ID"></div>
     * @optional
     */
    content: {
      type: String,
      default: null,
      required: false
    }
  },

  /**
   * @slot default - Main content with embed placeholders (for Slot mode)
   * @slot ce-embed-* - Content for embeds, where * is the embed ID
   */

  render(): VNode {
    // useDrupalCe is auto-imported by Nuxt
    const { renderCustomElements } = useDrupalCe();

    // Determine which mode we're in - slot mode or JSON mode
    const isJsonMode = typeof this.content !== 'undefined' && this.content !== null;

    // If we don't have content from either source, return empty fragment
    if (!isJsonMode && !this.$slots.default) {
      return h(Fragment);
    }

    // Process the VNode tree to replace div elements with data-ce-embed
    const processVNode = (vnode: VNode): VNode => {
      // If not a VNode object or is a text node, return it unchanged
      if (!vnode || typeof vnode !== 'object' || typeof vnode.type === 'undefined') {
        return vnode;
      }

      // If this is a div with data-ce-embed attribute, replace it with the corresponding slot content
      const embedId = vnode.props?.['data-ce-embed'] as string;
      if (embedId && vnode.type === 'div') {
        const slotName = `ce-embed-${embedId}`;
        if (this.$slots[slotName]) {
          // Get slot content and return the first node or wrap in Fragment if multiple
          const slotContent = this.$slots[slotName]();
          if (slotContent.length === 1) {
            return slotContent[0];
          } else {
            return h(Fragment, {}, slotContent);
          }
        }
      }

      // For component VNodes with children
      if (vnode.children) {
        // If children is an array, process each child
        if (Array.isArray(vnode.children)) {
          return {
            ...vnode,
            children: vnode.children.map(child => processVNode(child as VNode))
          };
        }
        // If children is an object (like a slots object)
        else if (typeof vnode.children === 'object' && vnode.children !== null) {
          const processedChildren: Record<string, any> = {};
          for (const key in vnode.children) {
            if (Object.prototype.hasOwnProperty.call(vnode.children, key)) {
              processedChildren[key] = processVNode((vnode.children as Record<string, any>)[key]);
            }
          }
          return {
            ...vnode,
            children: processedChildren
          };
        }
      }

      return vnode;
    };

    // Creates a composed view of HTML content with embedded custom elements
    const createJsonContent = () => {
      if (!this.content) return h(Fragment);

      // Process content by finding embeds and creating parts without extra wrappers
      const parts = [];
      let lastIndex = 0;
      const embedRegex = /<div\s+data-ce-embed="([^"]+)"[^>]*><\/div>/g;
      let match;
      let content = this.content;

      // Find all embed placeholders
      const embedInfos = [];
      while ((match = embedRegex.exec(content)) !== null) {
        const [fullMatch, embedId] = match;
        const slotName = `ce-embed-${embedId}`;

        embedInfos.push({
          id: embedId,
          slotName,
          start: match.index,
          end: match.index + fullMatch.length,
          match: fullMatch
        });
      }

      // If no embeds, just return the content as HTML
      if (embedInfos.length === 0) {
        return h('span', { innerHTML: content });
      }

      // Process content in order
      embedInfos.forEach((info, index) => {
        // Add content before this embed
        if (info.start > lastIndex) {
          const htmlContent = content.substring(lastIndex, info.start);
          if (htmlContent.trim()) {
            parts.push(h('span', { innerHTML: htmlContent }));
          }
        }

        // Add the embed content if available
        if (info.slotName in this.$attrs) {
          const embedContent = this.$attrs[info.slotName];
          if (embedContent) {
            // Use renderCustomElements to create the component
            const rendered = renderCustomElements(embedContent);
            if (rendered) {
              parts.push(rendered);
            }
          }
        } else {
          // Keep the placeholder if no content is available
          parts.push(h('div', { 'data-ce-embed': info.id }));
        }

        lastIndex = info.end;
      });

      // Add any remaining content
      if (lastIndex < content.length) {
        const htmlContent = content.substring(lastIndex);
        if (htmlContent.trim()) {
          parts.push(h('span', { innerHTML: htmlContent }));
        }
      }

      // Return all parts in a Fragment
      return h(Fragment, {}, parts);
    };

    try {
      // Handle slot-based mode
      if (!isJsonMode && this.$slots.default) {
        const defaultSlotContent = this.$slots.default();
        const processedContent = defaultSlotContent.map(vnode => processVNode(vnode as VNode));
        return h(Fragment, {}, processedContent);
      }
      // Handle JSON mode
      else if (isJsonMode) {
        return createJsonContent();
      }

      // Single fallback to empty fragment
      return h(Fragment);
    } catch (error) {
      console.error('Error processing content:', error);

      // Simple fallback based on mode
      if (isJsonMode && this.content) {
        return h('span', { innerHTML: this.content });
      } else if (this.$slots.default) {
        return h(Fragment, {}, this.$slots.default());
      }

      return h(Fragment);
    }
  }
});
