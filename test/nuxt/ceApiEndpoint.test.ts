// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useDrupalCe } from '../../src/runtime/composables/useDrupalCe'

const { useRuntimeConfigMock, useNuxtAppMock } = vi.hoisted(() => ({
  useRuntimeConfigMock: vi.fn().mockReturnValue({
    public: { drupalCe: { ceApiEndpoint: '/ce-api' } }
  }),
  useNuxtAppMock: vi.fn()
}))

describe('useDrupalCe() - getCeApiEndpoint() - handling of i18n localization in API endpoint paths', () => {
  beforeEach(() => {
    mockNuxtImport('useRuntimeConfig', () => useRuntimeConfigMock)
    mockNuxtImport('useNuxtApp', () => useNuxtAppMock)
  })

  it('returns base endpoint without i18n', () => {
    useNuxtAppMock.mockReturnValue({ $i18n: undefined })
    const { getCeApiEndpoint } = useDrupalCe()
    expect(getCeApiEndpoint()).toBe('/ce-api')
  })

  it('returns base endpoint for default locale', () => {
    useNuxtAppMock.mockReturnValue({
      $i18n: { locale: { value: 'en' }, defaultLocale: 'en' }
    })
    const { getCeApiEndpoint } = useDrupalCe()
    expect(getCeApiEndpoint()).toBe('/ce-api')
  })

  it('returns localized endpoint for non-default locale', () => {
    useNuxtAppMock.mockReturnValue({
      $i18n: { locale: { value: 'de' }, defaultLocale: 'en' }
    })
    const { getCeApiEndpoint } = useDrupalCe()
    expect(getCeApiEndpoint()).toBe('/ce-api/de')
  })

  it('returns base endpoint when localize=false', () => {
    useNuxtAppMock.mockReturnValue({
      $i18n: { locale: { value: 'de' }, defaultLocale: 'en' }
    })
    const { getCeApiEndpoint } = useDrupalCe()
    expect(getCeApiEndpoint(false)).toBe('/ce-api')
  })
})
