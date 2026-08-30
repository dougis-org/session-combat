// Minimal ambient declaration for `@3d-dice/dice-box` (ships no types). Only the surface
// `lib/dice/useDiceAnimation.ts` uses is modelled; the real animation is exercised by the
// E2E smoke, not the type checker.
declare module '@3d-dice/dice-box' {
  export interface DiceBoxConfig {
    /** CSS selector string for the mount point. v1.1.x rejects a DOM element here. */
    container?: string
    /** DOM id applied to the generated `<canvas>`. */
    id?: string
    assetPath?: string
    origin?: string
    scale?: number
    theme?: string
    offscreen?: boolean
    [key: string]: unknown
  }

  export interface DiceBoxResult {
    sides: number
    value: number
    groupId: number
    rollId: number
    [key: string]: unknown
  }

  export default class DiceBox {
    // v1.1.x: a single config object. `container` must be a CSS selector string.
    constructor(config: DiceBoxConfig)
    init(): Promise<unknown>
    roll(notation: string): Promise<DiceBoxResult[]>
    clear(): void
    onRollComplete?: (results: DiceBoxResult[]) => void
  }
}
