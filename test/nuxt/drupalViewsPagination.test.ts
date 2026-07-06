// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import DrupalView from '../../playground/components/global/drupal-view--default.vue'
import DrupalViewsPagination from '../../playground/components/Drupal/DrupalViewsPagination.vue'

describe('drupal-view pagination links', () => {
  const createViewComponent = (pager, slots = {}) => defineComponent({
    components: { 'drupal-view': DrupalView, 'drupal-views-pagination': DrupalViewsPagination },
    setup() {
      const { renderCustomElements } = useDrupalCe()
      return { component: renderCustomElements({
        element: 'drupal-view',
        props: { title: 'Test view', viewId: 'test', displayId: 'page_1', pager },
        slots,
      }) }
    },
    template: '<component :is="component" />',
  })

  it('renders bare ?page=N links when no filters are active', async () => {
    const wrapper = await mountSuspended(createViewComponent({ totalPages: 3, current: 0 }), {
      route: '/listing',
    })
    const hrefs = wrapper.findAll('.views-pager a').map(a => a.attributes('href'))
    // Page 2 and 3 links carry only the page param; the current first page is a
    // <span>, not a link.
    expect(hrefs).toContain('?page=1')
    expect(hrefs).toContain('?page=2')
  })

  it('preserves active exposed-filter query params in page links', async () => {
    const wrapper = await mountSuspended(createViewComponent({ totalPages: 3, current: 0 }), {
      route: '/listing?text=foo&kategorie=5',
    })
    const hrefs = wrapper.findAll('.views-pager a').map(a => a.attributes('href'))
    // Every page link keeps text= and kategorie= and appends page=.
    expect(hrefs).toContain('?text=foo&kategorie=5&page=1')
    expect(hrefs).toContain('?text=foo&kategorie=5&page=2')
    // No link drops the filters back to a bare ?page=N.
    expect(hrefs).not.toContain('?page=1')
  })

  it('drops the page param on the first-page link and marks the current page', async () => {
    // On page 1 (current=1), the link back to page 0 must carry filters but no
    // page param, and the active page must expose aria-current.
    const wrapper = await mountSuspended(createViewComponent({ totalPages: 3, current: 1 }), {
      route: '/listing?text=foo',
    })
    const hrefs = wrapper.findAll('.views-pager a').map(a => a.attributes('href'))
    expect(hrefs).toContain('?text=foo')
    expect(hrefs).not.toContain('?text=foo&page=0')
    expect(wrapper.find('.views-pager [aria-current="page"]').text()).toBe('2')
  })
})
