export default {
  inheritAttrs: false,
  props: {
    title: {
      default: '',
      type: String
    },
    kicker: {
      default: '',
      type: String
    },
    excerpt: {
      default: '',
      type: String
    },
    href: {
      default: '',
      type: String
    },
    image: {
      type: Object,
      default: () => ({})
    },
    publishedAt: {
      default: '',
      type: String
    },
    category: {
      default: '',
      type: String
    },
    author: {
      default: '',
      type: String
    },
    target: {
      type: String,
      default: '_self'
    }
  }
}
