<template>
  <div class="views-pager">
    <nav class="isolate inline-flex -space-x-px gap-1" aria-label="Pagination">
      <NuxtLink
        v-if="hasPrevious"
        class="relative inline-flex min-w-10 items-center px-2 py-2 text-sm"
        :to="toForPage(currentPage - 1)"
        @click="goTo(currentPage - 1)"
      >
        <span class="sr-only">Previous</span>
        &lt;&lt;
      </NuxtLink>

      <span
        v-if="showLeftEllipsis"
        class="relative inline-flex min-w-10 items-center px-4 py-2"
      >
        &hellip;
      </span>

      <component
        :is="page.index === currentPage ? 'span' : 'NuxtLink'"
        v-for="page in pageLinks"
        :key="page.index"
        :class="{
          'relative z-10 inline-flex min-w-10 items-center px-4 py-2': page.index === currentPage,
          'relative inline-flex min-w-10 items-center px-4 py-2': page.index !== currentPage,
        }"
        :to="page.index === currentPage ? undefined : toForPage(page.index)"
        @click="page.index === currentPage ? undefined : goTo(page.index)"
      >
        {{ page.label }}
      </component>

      <span
        v-if="showRightEllipsis"
        class="relative inline-flex min-w-10 items-center px-4 py-2"
      >
        &hellip;
      </span>

      <NuxtLink
        v-if="hasNext"
        class="relative inline-flex min-w-10 items-center px-2 py-2"
        :to="toForPage(currentPage + 1)"
        @click="goTo(currentPage + 1)"
      >
        <span class="sr-only">Next</span>
        &gt;&gt;
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    current: number,
    totalPages: number,
    maxLinks: number,
  }>(),
  {
    current: 0,
    totalPages: 0,
    maxLinks: 8,
  },
);

const emit = defineEmits<{
  'update:current': [value: number],
}>();

const route = useRoute();

const currentPage = computed(() => Math.max(0, props.current));
const totalPages = computed(() => Math.max(0, props.totalPages));
const maxLinks = computed(() => Math.max(1, props.maxLinks));

const startIndex = computed(() => {
  if (totalPages.value <= maxLinks.value) return 0;

  const half = Math.floor(maxLinks.value / 2);
  const maxStart = Math.max(totalPages.value - maxLinks.value, 0);

  return Math.min(Math.max(currentPage.value - half, 0), maxStart);
});

const endIndex = computed(() =>
  Math.min(startIndex.value + maxLinks.value - 1, totalPages.value - 1),
);

const pageLinks = computed(() => {
  const links: Array<{ index: number, label: number }> = [];

  for (let index = startIndex.value; index <= endIndex.value; index += 1) {
    links.push({ index, label: index + 1 });
  }

  return links;
});

const hasPrevious = computed(() => currentPage.value > 0);
const hasNext = computed(() => currentPage.value + 1 < totalPages.value);
const showLeftEllipsis = computed(() => startIndex.value > 0);
const showRightEllipsis = computed(() => endIndex.value < totalPages.value - 1);

function goTo(page: number) {
  emit('update:current', Math.max(0, page));
}

function toForPage(page: number) {
  const normalizedPage = Math.max(0, page);
  const query = { ...route.query } as Record<string, string | string[] | undefined>;

  if (normalizedPage > 0) {
    query.page = String(normalizedPage);
  } else {
    delete query.page;
  }

  return {
    path: route.path,
    query,
  };
}
</script>
