import { readFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

// Regression guard for design.md Decision 6 (task 3.1/3.4): the retired LocalStore gallery
// keys must never reappear in lib/ or app/ source.
describe('no source file reads or writes the retired dice-fab-colorset/-material keys', () => {
  it('grep finds no matches under lib/ or app/', () => {
    const root = join(process.cwd())
    const out = execSync(
      `grep -rl "dice-fab-colorset\\|dice-fab-material" lib app || true`,
      { cwd: root, encoding: 'utf-8' },
    ).trim()
    expect(out.split('\n').filter(Boolean)).toEqual([])
  })

  it('diceAppearance.ts / DiceAppearanceModal.tsx no longer exist', () => {
    for (const p of [
      'lib/dice/diceAppearance.ts',
      'lib/components/dice/DiceAppearanceModal.tsx',
    ]) {
      expect(() => readFileSync(join(process.cwd(), p))).toThrow()
    }
  })
})
