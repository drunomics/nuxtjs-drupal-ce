// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'
import { useNuxtApp } from '#imports'

// The test app's real runtime config provides ceApiEndpoint '/ce-api' (see the
// vitest.config.ts nuxt overrides); only the optional i18n injection is
// stubbed per test. Globally mocking useNuxtApp/useRuntimeConfig would poison
// the test app's own initialization.
describe('useDrupalCe() - getCeApiEndpoint() - handling of i18n localization in API endpoint paths', () => {
  const setI18n = (i18n?: { locale: { value: string }, defaultLocale: string }) => {
    // @ts-expect-error -- stubbing the optional $i18n injection.
    useNuxtApp().$i18n = i18n
  }

  afterEach(() => {
    setI18n(undefined)
  })

  it('returns base endpoint without i18n', () => {
    const { getCeApiEndpoint } = useDrupalCe()
    expect(getCeApiEndpoint()).toBe('/ce-api')
  })

  it('returns base endpoint for default locale', () => {
    setI18n({ locale: { value: 'en' }, defaultLocale: 'en' })
    const { getCeApiEndpoint } = useDrupalCe()
    expect(getCeApiEndpoint()).toBe('/ce-api')
  })

  it('returns localized endpoint for non-default locale', () => {
    setI18n({ locale: { value: 'de' }, defaultLocale: 'en' })
    const { getCeApiEndpoint } = useDrupalCe()
    expect(getCeApiEndpoint()).toBe('/ce-api/de')
  })

  it('returns base endpoint when localize=false', () => {
    setI18n({ locale: { value: 'de' }, defaultLocale: 'en' })
    const { getCeApiEndpoint } = useDrupalCe()
    expect(getCeApiEndpoint(false)).toBe('/ce-api')
  })
})
