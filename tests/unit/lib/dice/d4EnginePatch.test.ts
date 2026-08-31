import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

/**
 * Tripwire for the vendored d4 forced-face patch (`restore-d4-forced-face-support`, #627).
 *
 * `patches/@drdreo+dice-box-threejs+1.1.0.patch` restores `@`-notation forcing for d4 in
 * `@drdreo/dice-box-threejs@1.1.0`. It is applied by `patch-package` via the `postinstall`
 * script. `patch-package` already fails `npm ci` loudly if the patch no longer applies, but
 * a partial / rebased-away patch could still exit 0 on some npm versions — this test is the
 * deterministic backstop that runs in the unit job before e2e.
 */
const REPO_ROOT = join(__dirname, '../../../..')
const MARKER = '/* d4-forced-face patch #627 */'
const ENGINE_FILE = join(
  REPO_ROOT,
  'node_modules/@drdreo/dice-box-threejs/dist/dice-box-threejs.es.js',
)
const PATCH_FILE = join(REPO_ROOT, 'patches/@drdreo+dice-box-threejs+1.1.0.patch')

describe('d4 forced-face engine patch (#627)', () => {
  it('the patch file is committed and pinned to the exact engine version', () => {
    expect(existsSync(PATCH_FILE)).toBe(true)
    expect(readFileSync(PATCH_FILE, 'utf8')).toContain(MARKER)
  })

  it('the installed engine bundle contains the patch marker', () => {
    expect(existsSync(ENGINE_FILE)).toBe(true)
    const contents = readFileSync(ENGINE_FILE, 'utf8')
    if (!contents.includes(MARKER)) {
      throw new Error(
        'd4 forced-face patch is not applied to the installed engine. ' +
          'Run `npm ci` (which runs `patch-package` via postinstall). ' +
          'If that fails, the patch no longer applies to 1.1.0 — rebase ' +
          'patches/@drdreo+dice-box-threejs+1.1.0.patch, do not remove it.',
      )
    }
  })

  it('patch-package is wired into install (dependency + postinstall script)', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'))
    // In `dependencies`, not `devDependencies`: `postinstall` runs unconditionally, so a
    // future `npm ci --omit=dev` builder must still resolve `patch-package`.
    expect(pkg.dependencies['patch-package']).toBeDefined()
    expect(pkg.devDependencies?.['patch-package']).toBeUndefined()
    expect(pkg.scripts.postinstall).toMatch(/patch-package/)
  })

  it('the Docker build copies patches/ before `npm ci` so the shipped bundle is patched', () => {
    const dockerfile = readFileSync(join(REPO_ROOT, 'Dockerfile'), 'utf8')
    const copyPatches = dockerfile.search(/^\s*COPY\s+patches\b/m)
    const npmCi = dockerfile.search(/^\s*RUN\s+npm ci\b/m)
    expect(copyPatches).toBeGreaterThanOrEqual(0)
    expect(npmCi).toBeGreaterThanOrEqual(0)
    expect(copyPatches).toBeLessThan(npmCi)
  })

  it('no CI workflow disables install scripts (postinstall patch must run)', () => {
    const dir = join(REPO_ROOT, '.github/workflows')
    if (!existsSync(dir)) return
    for (const f of readdirSync(dir).filter(n => /\.ya?ml$/.test(n))) {
      // Only the npm install invocations matter — a bare `--ignore-scripts` on an
      // `npm ci` / `npm install` line would skip the `postinstall` patch step.
      for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
        if (/\bnpm (ci|install|i)\b/.test(line)) {
          expect(line).not.toMatch(/--ignore-scripts/)
        }
      }
    }
  })

  it('no lib/dice module special-cases the literal die size 4 (d4 is handled like every size)', () => {
    const dir = join(REPO_ROOT, 'lib/dice')
    for (const f of readdirSync(dir).filter(n => n.endsWith('.ts'))) {
      readFileSync(join(dir, f), 'utf8').split('\n').forEach((raw, i) => {
        const line = raw.trim()
        if (line.startsWith('*') || line.startsWith('//') || line.startsWith('/*')) return // comment line
        const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
        if (/(===|!==|==|!=)\s*4\b|\b4\s*(===|!==|==|!=)/.test(code)) {
          throw new Error(`lib/dice/${f}:${i + 1} compares against the literal 4 — d4 must not be special-cased: ${line}`)
        }
      })
    }
  })
})
