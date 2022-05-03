<script>
/**
 * @file
 * Mixin that provides props for supporting anchor tag attributes.
 */

export default {
  props: {
    href: {
      type: String,
      required: true
    },
    target: {
      type: String,
      default: '_self'
    }
  }
}
</script>
