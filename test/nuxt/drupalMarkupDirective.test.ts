// @vitest-environment nuxt
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createApp, createSSRApp, h, nextTick, ref, withDirectives } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { vDrupalMarkup } from '../../src/runtime/directives/drupalMarkup'
import DrupalMarkup from '../../playground/components/global/drupal-markup.vue'

const FORM = '<form><input name="name" value=""></form>'
const STEP_TWO = '<form><input name="step2" value=""></form>'
// Markup a browser normalizes into a different node structure than the string
// suggests: the stray <a> is closed and the second root node is kept.
const MALFORMED = '<div><input name="name" value=""><a></div><p>second root</p>'

const markupVNode = (markup: string) =>
  withDirectives(h('div', { style: 'display: contents' }), [[vDrupalMarkup, markup]])

const ssrApp = (render: () => unknown) => {
  const app = createSSRApp({ render })
  app.directive('drupal-markup', vDrupalMarkup)
  return app
}

const attachedContainer = () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

/**
 * Server-renders the app, lets a visitor type into the form before hydration
 * runs, then hydrates. Returns the input node from before and after.
 */
const typeBeforeHydration = async (render: () => unknown) => {
  const html = await renderToString(ssrApp(render))
  const container = attachedContainer()
  container.innerHTML = html
  const before = container.querySelector('input')!
  before.value = 'typed before hydration'
  ssrApp(render).mount(container, true)
  return { container, before, after: container.querySelector('input')! }
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('v-drupal-markup', () => {
  // R1: the markup reaches the server response.
  it('renders the markup during SSR', async () => {
    const html = await renderToString(ssrApp(() => markupVNode(FORM)))
    expect(html).toContain('<input name="name" value="">')
  })

  // R2: hydration adopts the server DOM instead of rewriting it.
  it('keeps DOM state that predates hydration', async () => {
    const { before, after } = await typeBeforeHydration(() => markupVNode(FORM))
    expect(after).toBe(before)
    expect(after.value).toBe('typed before hydration')
  })

  // R3: a mount without server-rendered DOM renders the markup itself.
  it('renders the markup on a client-side mount', () => {
    const container = attachedContainer()
    createApp({ render: () => markupVNode(FORM) }).mount(container)
    expect(container.querySelector('input[name=name]')).not.toBeNull()
  })

  // R4: a genuine content change replaces the markup, as v-html does.
  it('re-renders when the markup changes', async () => {
    const container = attachedContainer()
    const markup = ref(FORM)
    createApp({ render: () => markupVNode(markup.value) }).mount(container)

    markup.value = STEP_TWO
    await nextTick()

    expect(container.querySelector('input[name=step2]')).not.toBeNull()
    expect(container.querySelector('input[name=name]')).toBeNull()
  })

  // R5: a re-render with unchanged markup leaves the DOM and its state alone.
  it('leaves the DOM alone when a re-render does not change the markup', async () => {
    const container = attachedContainer()
    const unrelated = ref(0)
    createApp({ render: () => h('div', [unrelated.value, markupVNode(FORM)]) }).mount(container)
    const input = container.querySelector('input')!
    input.value = 'typed after mount'

    unrelated.value++
    await nextTick()

    expect(container.querySelector('input')).toBe(input)
    expect(container.querySelector('input')!.value).toBe('typed after mount')
  })

  // R6: hydration is silent - no mismatch warnings, no pruning.
  it('hydrates without warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    await typeBeforeHydration(() => markupVNode(FORM))

    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  // R7: no structural assumptions - markup the browser normalizes still works.
  it('hydrates markup the browser normalizes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container, before, after } = await typeBeforeHydration(() => markupVNode(MALFORMED))

    expect(after).toBe(before)
    expect(after.value).toBe('typed before hydration')
    expect(container.querySelector('p')!.textContent).toBe('second root')
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })
})

describe('drupal-markup', () => {
  // R2 for the reference component shipped with the module.
  it('keeps DOM state that predates hydration', async () => {
    const { before, after } = await typeBeforeHydration(() => h(DrupalMarkup, { content: FORM }))
    expect(after).toBe(before)
    expect(after.value).toBe('typed before hydration')
  })
})
