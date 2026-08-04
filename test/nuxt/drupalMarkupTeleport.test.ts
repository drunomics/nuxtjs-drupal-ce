// @vitest-environment nuxt
//
// Executable documentation of the supported pattern for putting an interactive
// Vue widget inside server-delivered Drupal markup.
//
// Vue never owns the DOM inside a `v-drupal-markup` blob, so a widget cannot be
// rendered into it directly. Drupal instead renders a placeholder element (a
// reCAPTCHA container, a map div, a "add to cart" mount point) and the frontend
// teleports a component onto it. The teleport is client-side only: the target
// lives inside an opaque markup string, so it does not exist in the server
// vdom.
import { describe, it, expect, afterEach } from 'vitest'
import { Teleport, createSSRApp, h, nextTick, onMounted, ref, withDirectives } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { vDrupalMarkup } from '../../src/runtime/directives/drupalMarkup'

/** Drupal markup: a form plus a placeholder for a frontend widget. */
const markupWithPlaceholder = (id: string) =>
  `<div><form><input name="name" value=""></form><div data-widget="${id}"></div></div>`

const STEP_ONE = markupWithPlaceholder('step-one')
const STEP_TWO = markupWithPlaceholder('step-two')

const Widget = { render: () => h('button', { class: 'widget' }, 'I am interactive') }

/**
 * Renders a Drupal markup string next to a widget teleported onto the
 * placeholder inside it.
 *
 * - `mounted` keeps the teleport out of SSR and out of the hydration pass:
 *   its target only exists once the markup is in the live DOM.
 * - `defer` lets the teleport resolve its target after the current render
 *   cycle, so a placeholder that the same cycle just wrote is found.
 * - the `key` remounts the teleport whenever the markup changes, which
 *   re-resolves the target: the previous placeholder was thrown away together
 *   with the previous markup.
 */
const markupWithWidget = (markup: () => string, target: () => string) => {
  const mounted = ref(false)
  onMounted(() => {
    mounted.value = true
  })
  return () => [
    withDirectives(h('div', { style: 'display: contents' }), [[vDrupalMarkup, markup()]]),
    mounted.value
      ? h(Teleport, { to: target(), defer: true, key: target() }, [h(Widget)])
      : null,
  ]
}

const attachedContainer = () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('interactive widgets inside Drupal markup', () => {
  it('teleports into the markup adopted by hydration, without disturbing it', async () => {
    const markup = ref(STEP_ONE)
    const target = ref('[data-widget="step-one"]')
    const app = () => createSSRApp({ setup: () => markupWithWidget(() => markup.value, () => target.value) })

    const html = await renderToString(app())
    expect(html).toContain('data-widget="step-one"')
    // The widget is a client-side concern - it must not appear in the SSR
    // response, whose markup blob Drupal owns end to end.
    expect(html).not.toContain('I am interactive')

    const container = attachedContainer()
    container.innerHTML = html

    // A visitor types into the server-rendered form before hydration runs.
    const input = container.querySelector('input')!
    input.value = 'typed before hydration'

    app().mount(container, true)
    await nextTick()

    // The widget landed inside the markup blob ...
    const widget = container.querySelector('.widget')!
    expect(widget).not.toBeNull()
    expect(widget.parentElement!.dataset.widget).toBe('step-one')

    // ... and the surrounding markup is still the DOM the server sent.
    expect(container.querySelector('input')).toBe(input)
    expect(container.querySelector('input')!.value).toBe('typed before hydration')
  })

  it('re-teleports onto the placeholder of the next markup', async () => {
    const markup = ref(STEP_ONE)
    const target = ref('[data-widget="step-one"]')
    const app = () => createSSRApp({ setup: () => markupWithWidget(() => markup.value, () => target.value) })

    const html = await renderToString(app())
    const container = attachedContainer()
    container.innerHTML = html
    app().mount(container, true)
    await nextTick()

    const firstWidget = container.querySelector('.widget')!

    // Drupal returns the next form step: new markup, new placeholder.
    markup.value = STEP_TWO
    target.value = '[data-widget="step-two"]'
    await nextTick()

    // The first markup is gone, and the widget teleported into it went with it.
    expect(container.querySelector('[data-widget="step-one"]')).toBeNull()
    expect(container.contains(firstWidget)).toBe(false)

    // The widget is now mounted on the placeholder of the new markup.
    const secondWidget = container.querySelector('.widget')!
    expect(secondWidget).not.toBeNull()
    expect(secondWidget.parentElement!.dataset.widget).toBe('step-two')
  })
})
