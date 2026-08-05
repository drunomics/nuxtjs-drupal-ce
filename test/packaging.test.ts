// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Guards the published package layout: the type declarations referenced by
 * the module's `addImports()` call and by the runtime `.d.ts` files must
 * actually be shipped in `dist`. Only `src/runtime/` is copied verbatim into
 * the package — types living elsewhere under `src/` silently vanish from the
 * npm tarball.
 *
 * Builds into a throwaway outDir so the stubbed `dist/` used by the other
 * test files is not touched.
 */
describe('packaging', () => {
  const rootDir = fileURLToPath(new URL('..', import.meta.url))
  const outDir = 'node_modules/.cache/packaging-test-dist'
  const dist = join(rootDir, outDir)

  beforeAll(() => {
    rmSync(dist, { recursive: true, force: true })
    execFileSync(
      join(rootDir, 'node_modules/.bin/nuxt-module-build'),
      ['build', '--outDir', outDir],
      { cwd: rootDir, stdio: 'pipe' },
    )
  }, 180_000)

  it('ships the runtime type declarations', () => {
    const typesFile = join(dist, 'runtime/types.d.ts')
    expect(existsSync(typesFile), 'dist/runtime/types.d.ts must be shipped').toBe(true)
    const content = readFileSync(typesFile, 'utf8')
    for (const name of ['CustomElementContent', 'DrupalCePage', 'DrupalCeApiResponse']) {
      expect(content).toMatch(new RegExp(`export (type|interface) ${name}\\b`))
    }
  })

  it('addImports() points at a file that is shipped and exports the type', () => {
    const moduleJs = readFileSync(join(dist, 'module.mjs'), 'utf8')
    const match = moduleJs.match(/from:\s*resolve\(["']([^"']+)["']\)/)
    expect(match, 'module.mjs must contain the type auto-import').toBeTruthy()
    const target = join(dist, match![1])
    expect(existsSync(target), `auto-import target ${match![1]} must exist in dist`).toBe(true)
    expect(readFileSync(target, 'utf8')).toContain('CustomElementContent')
  })

  it('runtime .d.ts imports of the shared types resolve within dist', () => {
    const composableDts = join(dist, 'runtime/composables/useDrupalCe/index.d.ts')
    const content = readFileSync(composableDts, 'utf8')
    const match = content.match(/from ["'](\.[^"']*types)(?:\.js)?["']/)
    expect(match, 'composable .d.ts must import the shared types').toBeTruthy()
    const resolved = join(dist, 'runtime/composables/useDrupalCe', `${match![1]}.d.ts`)
    expect(existsSync(resolved), `${match![1]} must resolve to a shipped .d.ts`).toBe(true)
  })
})
