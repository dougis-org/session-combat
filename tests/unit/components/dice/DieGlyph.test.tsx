import { render, screen } from '@testing-library/react'
import { DieGlyph } from '@/lib/components/dice/DieGlyph'
import { DIE_ICONS } from '@/lib/components/icons/dice'

describe('DieGlyph', () => {
  it.each([4, 6, 8, 10, 12, 20] as const)('sides=%i renders an icon and the visible text d%i', sides => {
    const { container } = render(<DieGlyph sides={sides} />)
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    const label = screen.getByText(`d${sides}`)
    expect(label).toBeInTheDocument()
    expect(label.textContent).toBe(`d${sides}`)
  })

  it('percentile variant renders exactly two d10 icons and the visible text d%', () => {
    const { container } = render(<DieGlyph sides="%" />)
    expect(container.querySelectorAll('svg')).toHaveLength(2)
    expect(screen.getByText('d%')).toBeInTheDocument()
  })

  it('DIE_ICONS keys are exactly the six die sizes (no 100 entry)', () => {
    expect(Object.keys(DIE_ICONS).map(Number).sort((a, b) => a - b)).toEqual([4, 6, 8, 10, 12, 20])
  })
})
