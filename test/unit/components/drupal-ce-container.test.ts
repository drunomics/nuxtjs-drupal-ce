// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useNuxtApp } from "#imports"

describe('DrupalCeContainer', () => {
  // Register test components
  const DrupalMedia = defineComponent({
    name: 'DrupalMedia',
    inheritAttrs: false,
    props: {
      id: String,
      content: String
    },
    template: '<div class="drupal-media" :data-id="id">{{ content }}</div>'
  })

  // Register components globally
  const app = useNuxtApp()
  app.vueApp.component('DrupalMedia', DrupalMedia)
  // Note: DrupalMarkup is already available in the playground

  // Helper function to normalize HTML by removing whitespace between elements
  const normalizeHtml = (html) => {
    return html
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .trim();                 // Trim leading/trailing whitespace
  }

  it('renders with slot-based content', async () => {
    const wrapper = await mountSuspended(defineComponent({
      template: `
        <DrupalCeContainer tag="section" class="test-container">
          <template #default>
            <drupal-markup>Cell content before embed</drupal-markup>
            <drupal-media id="123" content="Some example embedded element."></drupal-media>
            <drupal-markup>Cell content after embed</drupal-markup>
          </template>
        </DrupalCeContainer>
      `
    }))

    const html = normalizeHtml(wrapper.html())

    // Create a well-formatted expected HTML string for easy reading in the IDE
    const expectedHtml = normalizeHtml(`
      <section class="test-container">Cell content before embed<div class="drupal-media" data-id="123">Some example embedded element.</div>Cell content after embed</section>
    `)

    // Assert the exact HTML structure
    expect(html).toEqual(expectedHtml)
  })

  it('renders with JSON-based content', async () => {
    const { renderCustomElements } = useDrupalCe()

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return {
          component: renderCustomElements({
            element: 'drupal-ce-container',
            tag: 'section',
            class: 'test-container',
            content: [
              {
                'element': 'drupal-markup',
                'content': 'Cell content before embed'
              },
              {
                'element': 'drupal-media',
                'id': "123",
                'content': 'Some example embedded element.'
              },
              {
                'element': 'drupal-markup',
                'content': 'Cell content after embed'
              }
            ]
          })
        }
      },
      template: '<component :is="component" />'
    }))

    const html = normalizeHtml(wrapper.html())

    // Create a well-formatted expected HTML string for easy reading in the IDE
    // In JSON mode, DrupalMarkup components do add a wrapper div
    const expectedHtml = normalizeHtml(`
      <section class="test-container">
        <div style="display: contents;">Cell content before embed</div>
        <div class="drupal-media" data-id="123">Some example embedded element.</div>
        <div style="display: contents;">Cell content after embed</div>
      </section>
    `)

    // Assert the exact HTML structure
    expect(html).toEqual(expectedHtml)
  })

  it('respects the default tag prop value', async () => {
    const wrapper = await mountSuspended(defineComponent({
      template: `
        <DrupalCeContainer class="test-container">
          <template #default>
            <drupal-markup>Test content</drupal-markup>
          </template>
        </DrupalCeContainer>
      `
    }))

    const html = normalizeHtml(wrapper.html())

    // Create a well-formatted expected HTML string for easy reading in the IDE
    const expectedHtml = normalizeHtml(`
      <div class="test-container">Test content</div>
    `)

    // Assert the exact HTML structure
    expect(html).toEqual(expectedHtml)
  })

  it('works with empty content', async () => {
    const wrapper = await mountSuspended(defineComponent({
      template: `
        <DrupalCeContainer class="empty-container">
        </DrupalCeContainer>
      `
    }))

    const html = normalizeHtml(wrapper.html())

    // Create a well-formatted expected HTML string for easy reading in the IDE
    const expectedHtml = normalizeHtml(`
      <div class="empty-container"></div>
    `)

    // Assert the exact HTML structure
    expect(html).toEqual(expectedHtml)
  })

  it('renders table with embedded content using slot syntax', async () => {
    const wrapper = await mountSuspended(defineComponent({
      template: `
        <DrupalCeContainer tag="table">
          <DrupalCeContainer tag="tbody">
            <DrupalCeContainer tag="tr">
              <DrupalCeContainer tag="td">
                <drupal-markup>First column</drupal-markup>
              </DrupalCeContainer>
              <DrupalCeContainer tag="td">
                <drupal-markup><h2>Media heading</h2></drupal-markup>
                <drupal-media id="123" content="Media content"></drupal-media>
              </DrupalCeContainer>
            </DrupalCeContainer>
          </DrupalCeContainer>
        </DrupalCeContainer>
      `
    }))

    const html = normalizeHtml(wrapper.html())

    // Create a well-formatted expected HTML string for easy reading in the IDE
    const expectedHtml = normalizeHtml(`
      <table><tbody><tr><td>First column</td><td><h2>Media heading</h2><div class="drupal-media" data-id="123">Media content</div></td></tr></tbody></table>
    `)

    // Assert the exact HTML structure
    expect(html).toEqual(expectedHtml)
  })

  it('renders table with embedded content using JSON syntax', async () => {
    const { renderCustomElements } = useDrupalCe()

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return {
          component: renderCustomElements({
            element: 'drupal-ce-container',
            tag: 'table',
            content: [
              {
                element: 'drupal-ce-container',
                tag: 'tbody',
                content: [
                  {
                    element: 'drupal-ce-container',
                    tag: 'tr',
                    content: [
                      {
                        element: 'drupal-ce-container',
                        tag: 'td',
                        content: [
                          {
                            element: 'drupal-markup',
                            content: 'First column'
                          }
                        ]
                      },
                      {
                        element: 'drupal-ce-container',
                        tag: 'td',
                        content: [
                          {
                            element: 'drupal-markup',
                            content: '<h2>Media heading</h2>'
                          },
                          {
                            element: 'drupal-media',
                            id: '123',
                            content: 'Media content'
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          })
        }
      },
      template: '<component :is="component" />'
    }))

    const html = normalizeHtml(wrapper.html())

    // Create a well-formatted expected HTML string for easy reading in the IDE
    const expectedHtml = normalizeHtml(`
      <table>
        <tbody>
          <tr>
            <td>
              <div style="display: contents;">First column</div>
            </td>
            <td>
              <div style="display: contents;"><h2>Media heading</h2></div>
              <div class="drupal-media" data-id="123">Media content</div>
            </td>
          </tr>
        </tbody>
      </table>
    `)

    // Assert the exact HTML structure
    expect(html).toEqual(expectedHtml)
  })

})
