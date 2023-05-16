<template>
  <div class="views-pager">
    <nav class="isolate inline-flex -space-x-px gap-1" aria-label="Pagination">
      <a v-if="previousURL" :href="previousURL" class="relative inline-flex items-center px-2 py-2 text-sm min-w-10">
        <span class="sr-only">Previous</span>
        &lt;&lt;
      </a>
      <span v-if="hellipLeft" class="relative inline-flex items-center px-4 py-2 min-w-10">&hellip;</span>
      <template v-for="n in totalPages">
        <component
          v-if="n-1 ==  current || (n-1 < current && n-1 > current - (maxLinks/2)-1) || (n-1 > current && n-1 < current + (maxLinks/2)+1)"
          :is="n-1 == current ? 'span' : 'a'"
          :href="'?page=' + (n-1)"
          :class="{
            'relative z-10 inline-flex items-center px-4 py-2 min-w-10': n-1 == current,
            'relative inline-flex items-center px-4 py-2 min-w-10': n - 1 != current
          }">
          {{ n }}
        </component>
      </template>
      <span v-if="hellipRight" class="relative inline-flex items-center min-w-10">&hellip;</span>
      <a v-if="nextURL" :href="nextURL" class="relative inline-flex items-center px-2 py-2 min-w-10">
        <span class="sr-only">Next</span>
        &gt;&gt;
      </a>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  props: {
    current: {default: 0},
    totalPages: {default: 0},
    maxLinks: {default: 8}
  },
  data() {
    return {
      previousURL: this.current > 0 ? '?page=' + (this.current - 1) : null,
      nextURL: this.current + 1 < this.totalPages ? '?page=' + (this.current + 1) : null,
      hellipLeft: this.current > (this.maxLinks / 2) + 1,
      hellipRight: this.totalPages - this.current > (this.maxLinks / 2)
    }
  }
}
</script>
