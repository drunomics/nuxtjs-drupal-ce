<script lang="ts">
import { defineComponent, onMounted, type PropType } from 'vue'

/**
 * A single JS file of a Drupal library, as emitted by the backend.
 */
interface DrupalLibraryJsFile {
  /** Root-relative (e.g. `/core/misc/states.js?v=…`) or absolute URL. */
  url: string
  /** Optional attributes for the `<script>` tag (reserved). */
  attributes?: Record<string, unknown>
}

/**
 * Loads a Drupal JavaScript library in the decoupled frontend.
 *
 * The backend emits one `<drupal-library-*>` element per attached library
 * (form #states, autocomplete, …), in dependency order, as siblings of the
 * rendered markup, each carrying its resolved JS files. This is a thin consumer
 * of `useDrupalCe().loadLibrary()`: the actual loader is lazy-loaded on first
 * use. A specific library can be replaced with a native implementation by
 * adding a component named after its tag, e.g. `DrupalLibraryCoreDrupalStates.vue`.
 *
 * Renderless: it emits no markup, it only triggers the load side-effect — hence
 * `defineComponent` with a `() => null` render rather than `<script setup>`
 * (which requires a template root and would emit a wrapper element).
 */
export default defineComponent({
  props: {
    /** The Drupal library name, e.g. `core/drupal.states`. */
    library: {
      type: String,
      required: true,
    },
    /** JS files to load, in dependency order. */
    js: {
      type: Array as PropType<DrupalLibraryJsFile[]>,
      default: () => [],
    },
    /** Merged drupalSettings (JSON string); present on the first element only. */
    drupalSettings: {
      type: String,
      default: undefined,
    },
  },
  setup(props) {
    const { loadLibrary } = useDrupalCe()

    onMounted(() => {
      loadLibrary({ js: props.js, drupalSettings: props.drupalSettings })
    })

    // Renderless: emit no markup.
    return () => null
  },
})
</script>
