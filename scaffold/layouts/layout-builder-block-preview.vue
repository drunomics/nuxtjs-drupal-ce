<template>
  <div>
    <Nuxt />
  </div>
</template>

<script>
export default {
  data () {
    return {
      isIframeResizer: false
    }
  },
  head () {
    return {
      script: [
        {
          hid: 'iframeResizer',
          src: 'https://cdn.jsdelivr.net/npm/iframe-resizer@4.3.3/js/iframeResizer.contentWindow.min.js',
          defer: true,
          callback: () => { this.isIframeResizer = true }
        }
      ]
    }
  }
}
</script>
