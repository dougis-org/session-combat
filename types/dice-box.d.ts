// Minimal ambient declaration for `@3d-dice/dice-box` (ships no types). Only the surface
// `lib/dice/useDiceAnimation.ts` uses is modelled; the real animation is exercised by the
// E2E smoke, not the type checker.
declare module '@3d-dice/dice-box' {
  export interface DiceBoxConfig {
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
    constructor(selector: string | HTMLElement, config?: DiceBoxConfig)
    init(): Promise<unknown>
    roll(notation: string): Promise<DiceBoxResult[]>
    clear(): void
    onRollComplete?: (results: DiceBoxResult[]) => void
  }
}
