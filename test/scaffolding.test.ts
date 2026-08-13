// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

/**
 * Guards what `nuxt-drupal-ce-init` puts into a new project.
 *
 * The playground doubles as the scaffold: `pages/`, `layouts/`, `components/`
 * and `app.vue` are copied into the consuming project, while everything else
 * under `playground/` (demo API mocks in `server/`, demo assets in `public/`,
 * `nuxt.config.ts`) is playground-only. Two failure modes are covered:
 * demo files leaking into new projects, and a copied file importing something
 * that only exists inside this repository.
 */
describe('scaffolding', () => {
  const rootDir = fileURLToPath(new URL('..', import.meta.url))
  const scaffoldedFiles: string[] = []
  let targetDir: string

  const walk = (dir: string, base = dir): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry)
      return statSync(full).isDirectory() ? walk(full, base) : [relative(base, full)]
    })

  beforeAll(() => {
    targetDir = mkdtempSync(join(tmpdir(), 'drupal-ce-init-'))
    execFileSync(process.execPath, [join(rootDir, 'bin/nuxt-drupal-ce-init.cjs')], {
      cwd: targetDir,
      stdio: 'pipe',
    })
    scaffoldedFiles.push(...walk(targetDir))
  }, 60_000)

  afterAll(() => rmSync(targetDir, { recursive: true, force: true }))

  it('copies the scaffold entry points', () => {
    expect(scaffoldedFiles).toContain('app.vue')
    expect(scaffoldedFiles).toContain(join('pages', '[...slug].vue'))
    expect(scaffoldedFiles).toContain(join('layouts', 'default.vue'))
    expect(scaffoldedFiles).toContain(join('components', 'global', 'drupal-markup.vue'))
  })

  it('copies nothing from the playground-only directories', () => {
    const playgroundOnly = readdirSync(join(rootDir, 'playground'))
      .filter(entry => !['pages', 'layouts', 'components', 'app.vue', 'tsconfig.json'].includes(entry))
    // The demo API mocks and demo assets must stay behind.
    expect(playgroundOnly).toContain('server')
    expect(playgroundOnly).toContain('public')
    for (const entry of playgroundOnly) {
      expect(scaffoldedFiles.filter(file => file === entry || file.startsWith(entry + sep))).toEqual([])
    }
  })

  it('every relative import of a scaffolded file resolves inside the scaffold', () => {
    const candidates = (specifier: string, from: string) => {
      const base = resolve(dirname(from), specifier)
      return [base, `${base}.vue`, `${base}.ts`, `${base}.js`, join(base, 'index.ts')]
    }

    for (const file of scaffoldedFiles) {
      const full = join(targetDir, file)
      const source = readFileSync(full, 'utf8')
      for (const [, specifier] of source.matchAll(/(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g)) {
        const resolved = candidates(specifier, full).find(existsSync)
        expect(resolved, `${file} imports "${specifier}", which does not exist in a scaffolded project`)
          .toBeTruthy()
        expect(relative(targetDir, resolved!).startsWith('..'), `${file} imports "${specifier}" from outside the scaffold`)
          .toBe(false)
      }
    }
  })

  it('does not publish the playground-only directories', () => {
    const output = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    })
    const published: string[] = JSON.parse(output)[0].files.map((file: { path: string }) => file.path)
    expect(published).toContain('playground/components/global/drupal-markup.vue')
    expect(published.filter(path => /^playground\/(server|public)\//.test(path))).toEqual([])
  })
})
