import { h, Fragment, defineComponent } from 'vue';
import type { VNode } from 'vue';

export default defineComponent({
  name: 'DrupalMarkupEmbeds',
  render(): VNode {
    if (!this.$slots.default) {
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
      const slotName = embedId ? `ce-embed-${embedId}` : null;

      if (vnode.type === 'div' &&
        vnode.props &&
        slotName &&
        this.$slots[slotName]) {
        // Get slot content and return the first node or wrap in Fragment if multiple
        const slotContent = this.$slots[slotName]();
        if (slotContent.length === 1) {
          return slotContent[0];
        } else {
          return h(Fragment, {}, slotContent);
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

    // Get the default slot content
    const defaultSlotContent = this.$slots.default();

    // Process all VNodes in the default slot
    try {
      const processedContent = defaultSlotContent.map(vnode => processVNode(vnode as VNode));

      // Always use Fragment and never wrap in a div
      return h(Fragment, {}, processedContent);
    } catch (error) {
      console.error('Error processing content:', error);
      // Fall back to unprocessed content if there's an error
      return h(Fragment, {}, defaultSlotContent);
    }
  }
});
