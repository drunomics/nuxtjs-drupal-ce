// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import type { DrupalMessage } from '../../src/runtime/types'

type IndexModule = typeof import('../../src/runtime/composables/useDrupalCe/index')

/**
 * Tests routing Drupal's `message` AJAX command into the global messages state.
 * `Drupal.AjaxCommands` is stubbed; the assertions cover the handler the
 * frontend installs over it — type mapping, `clearPrevious`, and the install-
 * once guard.
 */
describe('installDrupalMessageCommand', () => {
  let installDrupalMessageCommand: IndexModule['installDrupalMessageCommand']
  let messages: ReturnType<typeof ref<DrupalMessage[]>>

  beforeEach(async () => {
    // Fresh module per test so the install-once guard resets.
    vi.resetModules()
    ;({ installDrupalMessageCommand } = await import('../../src/runtime/composables/useDrupalCe/index'))
    messages = ref<DrupalMessage[]>([])
    ;(window as unknown as { Drupal?: unknown }).Drupal = { AjaxCommands: function () {} }
    ;(window as unknown as { Drupal: { AjaxCommands: { prototype: Record<string, unknown> } } })
      .Drupal.AjaxCommands.prototype = {}
  })

  /** The message command handler after installation. */
  const messageCommand = () => (window as unknown as {
    Drupal: { AjaxCommands: { prototype: { message: (a: unknown, r: unknown, s?: unknown) => void } } }
  }).Drupal.AjaxCommands.prototype.message

  it('pushes a message command into the global messages state', () => {
    installDrupalMessageCommand(messages)
    // The payload core's MessageCommand emits (ManagedFile upload error).
    messageCommand()({}, { message: 'The file is too big.', messageOptions: { type: 'error' }, clearPrevious: true })
    expect(messages.value).toEqual([{ type: 'error', message: 'The file is too big.' }])
  })

  it('maps status and unknown types to success, keeps warning', () => {
    installDrupalMessageCommand(messages)
    messageCommand()({}, { message: 'Saved.', messageOptions: { type: 'status' } })
    messageCommand()({}, { message: 'Careful.', messageOptions: { type: 'warning' } })
    messageCommand()({}, { message: 'FYI.' })
    expect(messages.value).toEqual([
      { type: 'success', message: 'Saved.' },
      { type: 'warning', message: 'Careful.' },
      { type: 'success', message: 'FYI.' },
    ])
  })

  it('clears previous messages when clearPrevious is set', () => {
    installDrupalMessageCommand(messages)
    messageCommand()({}, { message: 'First try failed.', messageOptions: { type: 'error' }, clearPrevious: true })
    messageCommand()({}, { message: 'And a detail.' })
    messageCommand()({}, { message: 'Second try failed.', messageOptions: { type: 'error' }, clearPrevious: true })
    expect(messages.value).toEqual([{ type: 'error', message: 'Second try failed.' }])
  })

  it('is a no-op when Drupal.AjaxCommands is not yet defined', () => {
    ;(window as unknown as { Drupal?: unknown }).Drupal = {}
    expect(() => installDrupalMessageCommand(messages)).not.toThrow()
  })

  it('installs once, ignoring repeat calls', () => {
    installDrupalMessageCommand(messages)
    const first = messageCommand()
    installDrupalMessageCommand(ref<DrupalMessage[]>([]))
    expect(messageCommand()).toBe(first)
  })
})
