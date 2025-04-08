// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useNuxtApp } from "#imports"

describe('DrupalMarkupEmbeds JSON Mode', () => {
  // Register the test components we'll need
  const TestEmbed = defineComponent({
    name: 'TestEmbed',
    inheritAttrs: false,
    props: {
      prop1: String
    },
    template: '<div class="test-embed">{{ prop1 }}</div>'
  })

  const SecondEmbed = defineComponent({
    name: 'SecondEmbed',
    inheritAttrs: false,
    props: {
      prop2: String
    },
    template: '<div class="second-embed">{{ prop2 }}</div>'
  })

  // Register components globally
  const app = useNuxtApp()
  app.vueApp.component('TestEmbed', TestEmbed)
  app.vueApp.component('SecondEmbed', SecondEmbed)
  // Note: DrupalMarkup is already available in the test playground

  // Helper function to normalize HTML (remove extra whitespace between tags)
  const normalizeHtml = (html) => {
    return html
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .trim();                 // Trim leading/trailing whitespace
  }

  it('renders basic HTML content without embeds', async () => {
    const { renderCustomElements } = useDrupalCe()

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return {
          component: renderCustomElements({
            element: 'drupal-markup-embeds',
            content: '<p>Basic <strong>HTML</strong> content without embeds</p>'
          })
        }
      },
      template: '<component :is="component" />'
    }))

    // The content should be wrapped in a div with our content inside
    const html = normalizeHtml(wrapper.html());
    expect(html).toMatch(/<div.*?><p>Basic <strong>HTML<\/strong> content without embeds<\/p><\/div>/);
  })

  it('renders content with a single embed', async () => {
    const { renderCustomElements } = useDrupalCe()

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return {
          component: renderCustomElements({
            element: 'drupal-markup-embeds',
            content: '<div>Content with <div data-ce-embed="1"></div> embed</div>',
            'ce-embed-1': {
              element: 'test-embed',
              prop1: 'Embedded content'
            }
          })
        }
      },
      template: '<component :is="component" />'
    }))

    // Normalize and check the HTML structure
    const html = normalizeHtml(wrapper.html());

    // Check for the content segment before embed
    expect(html).toEqual(/<div class="markup-segment"><div>Content with <\/div><\/div>/);

    // Check for the embedded content
    expect(html).toMatch(/<div class="embed-wrapper"><div class="test-embed">Embedded content<\/div><\/div>/);

    // Check for the content segment after embed
    expect(html).toMatch(/<div class="markup-segment"> embed<\/div>/);

    // Verify the embed placeholder is not present
    expect(html).not.toContain('data-ce-embed="1"');
  })

  it('renders table with embedded content', async () => {
    const { renderCustomElements } = useDrupalCe()

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return {
          component: renderCustomElements({
            element: 'drupal-markup-embeds',
            content: `
              <table>
                <tbody>
                  <tr>
                    <td>Cell content before embed</td>
                    <td><div data-ce-embed="table-embed"></div></td>
                    <td>Cell content after embed</td>
                  </tr>
                </tbody>
              </table>
            `,
            'ce-embed-table-embed': {
              element: 'test-embed',
              prop1: 'Table embedded content'
            }
          })
        }
      },
      template: '<component :is="component" />'
    }))

    // Normalize and check the HTML structure
    const html = normalizeHtml(wrapper.html());

    // Verify the table structure starts correctly
    expect(html).toMatch(/<div class="markup-segment"><table><tbody><tr><td>Cell content before embed<\/td>/);

    // Verify the embedded content
    expect(html).toMatch(/<div class="embed-wrapper"><div class="test-embed">Table embedded content<\/div><\/div>/);

    // Verify the table structure ends correctly
    expect(html).toMatch(/<div class="markup-segment"><td>Cell content after embed<\/td><\/tr><\/tbody><\/table>/);

    // Verify the embed placeholder is not present
    expect(html).not.toContain('data-ce-embed="table-embed"');
  })

  it('handles missing embed content gracefully', async () => {
    const { renderCustomElements } = useDrupalCe()

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return {
          component: renderCustomElements({
            element: 'drupal-markup-embeds',
            content: '<div>Content with <div data-ce-embed="missing"></div> missing embed</div>'
          })
        }
      },
      template: '<component :is="component" />'
    }))

    // Normalize and check the HTML structure
    const html = normalizeHtml(wrapper.html());

    // The missing embed placeholder should remain in the output
    expect(html).toMatch(/<div>Content with <div data-ce-embed="missing"><\/div> missing embed<\/div>/);
  })

  it('renders with drupal-markup element type', async () => {
    const { renderCustomElements } = useDrupalCe()

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return {
          component: renderCustomElements({
            element: 'drupal-markup-embeds',
            content: '<div>Content with <div data-ce-embed="markup"></div></div>',
            'ce-embed-markup': {
              element: 'drupal-markup',
              content: '<span class="special-markup">Special markup content</span>'
            }
          })
        }
      },
      template: '<component :is="component" />'
    }))

    // Normalize and check the HTML structure
    const html = normalizeHtml(wrapper.html());

    // Check for content before embed
    expect(html).toMatch(/<div class="markup-segment"><div>Content with\s*<\/div><\/div>/);

    // Check for the drupal-markup content
    expect(html).toMatch(/<div class="embed-wrapper"><span class="special-markup">Special markup content<\/span><\/div>/);

    // Check for content after embed (could be empty or just closing div)
    expect(html).toMatch(/<div class="markup-segment">\s*<\/div><\/div>/);

    // Verify the embed placeholder is not present
    expect(html).not.toContain('data-ce-embed="markup"');
  })

  it('renders content with multiple embeds in nested HTML', async () => {
    const { renderCustomElements } = useDrupalCe()

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return {
          component: renderCustomElements({
            element: 'drupal-markup-embeds',
            content: `
              <article>
                <header>
                  <h1>Article with Embeds</h1>
                  <div class="meta">
                    <div data-ce-embed="header-embed"></div>
                  </div>
                </header>
                <section>
                  <p>First paragraph</p>
                  <div class="embedded-content">
                    <div data-ce-embed="1"></div>
                  </div>
                  <p>Middle paragraph</p>
                  <blockquote>
                    <div data-ce-embed="2"></div>
                  </blockquote>
                  <p>Last paragraph</p>
                </section>
              </article>
            `,
            'ce-embed-header-embed': {
              element: 'drupal-markup',
              content: '<span class="date">January 15, 2023</span>'
            },
            'ce-embed-1': {
              element: 'test-embed',
              prop1: 'First nested embed'
            },
            'ce-embed-2': {
              element: 'second-embed',
              prop2: 'Second nested embed'
            }
          })
        }
      },
      template: '<component :is="component" />'
    }))

    // Normalize and check the HTML structure
    const html = normalizeHtml(wrapper.html());

    // Check for the article structure
    expect(html).toMatch(/<article>/);
    expect(html).toMatch(/<header>/);
    expect(html).toMatch(/<h1>Article with Embeds<\/h1>/);
    expect(html).toMatch(/<div class="meta">/);

    // Check for the embedded components
    expect(html).toMatch(/<span class="date">January 15, 2023<\/span>/);
    expect(html).toMatch(/<div class="test-embed">First nested embed<\/div>/);
    expect(html).toMatch(/<div class="second-embed">Second nested embed<\/div>/);

    // Verify the structure has the right parts after embeds
    expect(html).toMatch(/<p>Middle paragraph<\/p>/);
    expect(html).toMatch(/<p>Last paragraph<\/p>/);

    // Verify the embed placeholders are not present
    expect(html).not.toContain('data-ce-embed="1"');
    expect(html).not.toContain('data-ce-embed="2"');
    expect(html).not.toContain('data-ce-embed="header-embed"');
  })
})
