// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import App from '~/app.vue'

describe('Metadata handling', () => {
  registerEndpoint('/api/drupal-ce/testing/metadata', () => ({
    content: {
      element: 'drupal-markup',
      body: '<p>Test content</p>'
    },
    local_tasks: {},
    messages: [],
    title: 'Test Page Title',
    metatags: {
      meta: [
        {
          name: 'title',
          content: 'Test Page | Site Name'
        },
        {
          name: 'description',
          content: 'Test page description for metadata verification'
        }
      ],
      link: [
        {
          rel: 'canonical',
          href: 'https://example.com/testing/metadata'
        }
      ],
      jsonld: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebPage",
            "@id": "https://example.com/testing/metadata",
            "headline": "Test Page",
            "description": "Test page description for metadata verification",
            "datePublished": "2024-01-14T08:49:16+0200",
            "image": {
              "@type": "ImageObject",
              "url": "https://example.com/image.jpg",
              "width": "1200",
              "height": "630"
            }
          }
        ]
      }
    }
  }))

  registerEndpoint('/api/menu/api/menu_items/main', () => ([]))

  it('renders page with correct metadata', async () => {
    const component = await mountSuspended(App, {
      route: '/testing/metadata'
    })

    // Verify basic content rendering
    expect(component.html()).toContain('<p>Test content</p>')

    // Wait for head updates to be applied
    await new Promise(resolve => setTimeout(resolve, 100))

    // Get document head after updates
    const head = document.head.innerHTML

    // Test meta tags
    expect(head).toContain('<meta name="title" content="Test Page | Site Name">')
    expect(head).toContain('<meta name="description" content="Test page description for metadata verification">')

    // Test canonical link
    expect(head).toContain('<link rel="canonical" href="https://example.com/testing/metadata">')

    // Test JSON-LD script tag
    const jsonLdScript = document.querySelector('script[type="application/ld+json"]')
    expect(jsonLdScript).toBeTruthy()

    const jsonLd = JSON.parse(jsonLdScript.textContent)
    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://example.com/testing/metadata",
          "headline": "Test Page",
          "description": "Test page description for metadata verification",
          "datePublished": "2024-01-14T08:49:16+0200",
          "image": {
            "@type": "ImageObject",
            "url": "https://example.com/image.jpg",
            "width": "1200",
            "height": "630"
          }
        }
      ]
    })
  })
})
