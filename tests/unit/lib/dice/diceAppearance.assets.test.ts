import { existsSync } from 'fs'
import { join } from 'path'
import { DICE_COLORSETS } from '@/lib/dice/diceAppearance'
import {
  COLORSET_TEXTURE_FILES,
  TEXTURE_PUBLIC_DIR,
} from './__fixtures__/diceBoxEngineFacts'

/**
 * Build gate: every colorset offered in the registry must resolve only to textures already
 * vendored under `public/dice-box-threejs/textures/`, so selecting any option can never make
 * the engine request a missing asset (404 / broken die). If a future engine upgrade renames
 * or drops a colorset, the fixture goes stale and this fails.
 */
const texturesDir = join(process.cwd(), TEXTURE_PUBLIC_DIR)

function texturePath(name: string): string {
  return join(texturesDir, `${name}.webp`)
}

describe('diceAppearance assets (task 2.3)', () => {
  it('2.3-a every registry colorset texture exists on disk', () => {
    const missing: string[] = []
    for (const cs of DICE_COLORSETS) {
      const files = COLORSET_TEXTURE_FILES[cs.id] ?? []
      for (const file of files) {
        if (!existsSync(texturePath(file))) missing.push(`${cs.id} -> ${file}.webp`)
      }
    }
    expect(missing).toEqual([])
  })

  it('2.3-b negative control: a fake texture name is correctly reported missing', () => {
    expect(existsSync(texturePath('definitely-not-a-real-texture'))).toBe(false)
  })
})
