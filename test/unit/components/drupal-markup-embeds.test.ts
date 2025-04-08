// test/unit/components/drupal-markup-embeds.test.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'

describe('DrupalMarkupEmbeds component', () => {
  it('renders basic content without embeds', async () => {
    const TestComponent = defineComponent({
      template: `
        <DrupalMarkupEmbeds>
          <template #default>
            <p>Basic content without embeds</p>
          </template>
        </DrupalMarkupEmbeds>
      `
    })

    const wrapper = await mountSuspended(TestComponent)
    expect(wrapper.html()).toBe('<p>Basic content without embeds</p>')
  })

  it('replaces single embed with corresponding slot content', async () => {
    const TestComponent = defineComponent({
      template: `
        <DrupalMarkupEmbeds>
          <template #default>
            <h2>Content with embed</h2>
            <div data-ce-embed="123"></div>
          </template>
          <template #ce-embed-123>
            <p>Embedded content</p>
          </template>
        </DrupalMarkupEmbeds>
      `
    })

    const wrapper = await mountSuspended(TestComponent)
    expect(wrapper.html()).toBe('<h2>Content with embed</h2>\n<p>Embedded content</p>')
  })

  it('replaces multiple embeds with corresponding slot content', async () => {
    const TestComponent = defineComponent({
      template: `
        <DrupalMarkupEmbeds>
          <template #default>
            <h2>This is the main content</h2>
            <div data-ce-embed="321"></div>
            <p>Some html <strong>markup</strong></p>
            <div class="foo">
              <div data-ce-embed="456"></div>
            </div>
          </template>
          <template #ce-embed-321>
            <div>Embed 321</div>
          </template>
          <template #ce-embed-456>
            <div>Embed <strong>456</strong></div>
          </template>
        </DrupalMarkupEmbeds>
      `
    })

    const wrapper = await mountSuspended(TestComponent)

    // Verify the exact HTML structure with newlines
    const expectedHTML =
      '<h2>This is the main content</h2>\n' +
      '<div>Embed 321</div>\n' +
      '<p>Some html <strong>markup</strong></p>\n' +
      '<div class="foo">\n' +
      '  <div>Embed <strong>456</strong></div>\n' +
      '</div>';

    expect(wrapper.html()).toBe(expectedHTML)
  })

  it('preserves embed div if no matching slot is found', async () => {
    const TestComponent = defineComponent({
      template: `
        <DrupalMarkupEmbeds>
          <template #default>
            <h2>Content with missing embed</h2>
            <div data-ce-embed="missing"></div>
          </template>
        </DrupalMarkupEmbeds>
      `
    })

    const wrapper = await mountSuspended(TestComponent)
    const expectedHTML =
      '<h2>Content with missing embed</h2>\n' +
      '<div data-ce-embed="missing"></div>';

    expect(wrapper.html()).toBe(expectedHTML)
  })

  it('handles nested embeds properly', async () => {
    const TestComponent = defineComponent({
      template: `
        <DrupalMarkupEmbeds>
          <template #default>
            <div class="outer">
              <div data-ce-embed="outer"></div>
            </div>
          </template>
          <template #ce-embed-outer>
            <div class="inner-container">
              Outer content
              <div data-ce-embed="inner"></div>
            </div>
          </template>
          <template #ce-embed-inner>
            <span>Inner content</span>
          </template>
        </DrupalMarkupEmbeds>
      `
    })

    const wrapper = await mountSuspended(TestComponent)

    // Verify the exact HTML structure with nested elements
    const expectedHTML =
      '<div class="outer">\n' +
      '  <div class="inner-container"> Outer content <div data-ce-embed="inner"></div>\n' +
      '  </div>\n' +
      '</div>';

    expect(wrapper.html()).toBe(expectedHTML)
  })

  it('handles complex embeds with multiple elements', async () => {
    const TestComponent = defineComponent({
      template: `
        <DrupalMarkupEmbeds>
          <template #default>
            <article>
              <h1>Article title</h1>
              <div data-ce-embed="complex"></div>
              <p>Conclusion paragraph</p>
            </article>
          </template>
          <template #ce-embed-complex>
            <h2>Section heading</h2>
            <p>First paragraph</p>
            <p>Second paragraph</p>
            <ul>
              <li>List item 1</li>
              <li>List item 2</li>
            </ul>
          </template>
        </DrupalMarkupEmbeds>
      `
    })

    const wrapper = await mountSuspended(TestComponent)

    const expectedHTML =
      '<article>\n' +
      '  <h1>Article title</h1>\n' +
      '  <h2>Section heading</h2>\n' +
      '  <p>First paragraph</p>\n' +
      '  <p>Second paragraph</p>\n' +
      '  <ul>\n' +
      '    <li>List item 1</li>\n' +
      '    <li>List item 2</li>\n' +
      '  </ul>\n' +
      '  <p>Conclusion paragraph</p>\n' +
      '</article>';

    expect(wrapper.html()).toBe(expectedHTML)
  })

  it('handles embeds within a table structure', async () => {
    const TestComponent = defineComponent({
      template: `
        <DrupalMarkupEmbeds>
          <template #default>
            <table style="border: 1px solid black; border-collapse: collapse;">
              <tbody>
                <tr>
                  <td style="border: 1px solid black; padding: 8px;">
                    Cell content before embed
                    <div data-ce-embed="table-embed"></div>
                    Cell content after embed
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
          <template #ce-embed-table-embed>
            <span style="color: blue; font-weight: bold;">Embedded table content</span>
          </template>
        </DrupalMarkupEmbeds>
      `
    })

    const wrapper = await mountSuspended(TestComponent)

    const expectedHTML =
      '<table style="border: 1px solid black; border-collapse: collapse;">\n' +
      '  <tbody>\n' +
      '    <tr>\n' +
      '      <td style="border: 1px solid black; padding: 8px;"> Cell content before embed <span style="color: blue; font-weight: bold;">Embedded table content</span> Cell content after embed </td>\n' +
      '    </tr>\n' +
      '  </tbody>\n' +
      '</table>';

    expect(wrapper.html()).toBe(expectedHTML)
  })
})
