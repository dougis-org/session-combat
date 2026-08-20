import { render } from '@testing-library/react'
import {
  DiceD4Icon,
  DiceD6Icon,
  DiceD8Icon,
  DiceD10Icon,
  DiceD12Icon,
  DiceD20Icon,
  DIE_ICONS,
} from '@/lib/components/icons/dice'

const ICONS_BY_SIDES: Record<number, React.ComponentType<{ width?: number | string; height?: number | string; className?: string }>> = {
  4: DiceD4Icon,
  6: DiceD6Icon,
  8: DiceD8Icon,
  10: DiceD10Icon,
  12: DiceD12Icon,
  20: DiceD20Icon,
}

describe('dice icon module', () => {
  it('exports a distinct icon component for each supported die size', () => {
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      expect(ICONS_BY_SIDES[sides]).toBeDefined()
    }
  })

  it.each([4, 6, 8, 10, 12, 20])('DiceD%iIcon renders valid SVG markup', (sides) => {
    const Icon = ICONS_BY_SIDES[sides]
    const { container } = render(<Icon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg?.querySelector('path, polygon, circle, rect')).toBeInTheDocument()
  })

  it.each([4, 6, 8, 10, 12, 20])('DiceD%iIcon forwards width, height, and className', (sides) => {
    const Icon = ICONS_BY_SIDES[sides]
    const { container } = render(<Icon width={32} height={32} className="text-yellow-400" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
    expect(svg).toHaveClass('text-yellow-400')
  })

  it('DIE_ICONS lookup resolves the correct component per size', () => {
    expect(DIE_ICONS[20]).toBe(DiceD20Icon)
    expect(DIE_ICONS[4]).toBe(DiceD4Icon)
    expect(DIE_ICONS[6]).toBe(DiceD6Icon)
    expect(DIE_ICONS[8]).toBe(DiceD8Icon)
    expect(DIE_ICONS[10]).toBe(DiceD10Icon)
    expect(DIE_ICONS[12]).toBe(DiceD12Icon)
  })

  it('DIE_ICONS covers exactly the supported die sizes', () => {
    expect(Object.keys(DIE_ICONS).map(Number).sort((a, b) => a - b)).toEqual([4, 6, 8, 10, 12, 20])
  })

  it('includes attribution to game-icons.net and Delapouite under CC BY 3.0 in the module source', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const source = fs.readFileSync(
      path.join(process.cwd(), 'lib/components/icons/dice.tsx'),
      'utf-8'
    )
    expect(source).toMatch(/game-icons\.net/)
    expect(source).toMatch(/Delapouite/)
    expect(source).toMatch(/CC BY 3\.0/)
  })
})
