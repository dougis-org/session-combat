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

  it('no CI workflow disables install scripts (postinstall patch must run)', () => {
    const dir = join(REPO_ROOT, '.github/workflows')
    const files = readdirSync(dir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
    for (const f of files) {
      const body = readFileSync(join(dir, f), 'utf8')
      expect(body).not.toMatch(/--ignore-scripts/)
      expect(body).not.toMatch(/ignore-scripts\s*[:=]\s*true/)
    }
  })
})
