import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Module renders pages', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    configFile: 'nuxt.config4test',
    port: 3001,
  })

  it('renders homepage', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Welcome to your custom-elements enabled Drupal site')
  })

  it('renders menu', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Another page')
    expect(html).toContain('Test page')
  })

  it('renders test page with metadata', async () => {
    const html = await $fetch('/node/1')

    // Content
    expect(html).toContain('Node: Test page')

    // Meta tags
    expect(html).toContain('<meta name="title" content="Test page | lupus decoupled">')
    expect(html).toContain('<meta name="description" content="Lorem ipsum dolor sit amet, consectetur adipiscing elit')

    // Canonical link and alternates
    expect(html).toContain('<link rel="canonical" href="https://8080-drunomics-lupusdecouple-fd0ilwlpax7.ws-eu86.gitpod.io/node/1">')
    expect(html).toContain('<link rel="alternate" hreflang="de" href="https://8080-drunomics-lupusdecouple-fd0ilwlpax7.ws-eu86.gitpod.io/de/node/1">')
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://8080-drunomics-lupusdecouple-fd0ilwlpax7.ws-eu86.gitpod.io/node/1">')

    // Local tasks
    expect(html).toContain('href="/node/1/edit"')
    expect(html).toContain('href="/node/1/delete"')
    expect(html).toContain('href="/node/1/revisions"')

    // JSON-LD check
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)
    expect(jsonLdMatch).toBeTruthy()

    const jsonLd = JSON.parse(jsonLdMatch[1])
    expect(jsonLd).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://example.com/testing/metadata',
          'headline': 'Test Page',
          'description': 'Test page description for metadata verification',
          'datePublished': '2024-01-14T08:49:16+0200',
          'image': {
            '@type': 'ImageObject',
            'url': 'https://example.com/image.jpg',
            'width': '1200',
            'height': '630',
          },
        },
      ],
    })
  })
})
