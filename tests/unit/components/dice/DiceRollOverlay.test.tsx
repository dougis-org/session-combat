import { render, screen } from '@testing-library/react'
import { DiceRollOverlay } from '@/lib/components/dice/DiceRollOverlay'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'

describe('DiceRollOverlay / StaticRollResult', () => {
  const onClose = jest.fn()

  it('renders percentile faces correctly', () => {
    const built: BuiltRoll = {
      formula: 'd%',
      total: 42,
      rolls: [42],
      breakdown: [],
      modifier: 0,
      percentileFaces: [4, 2],
    }

    render(
      <DiceRollOverlay
        built={built}
        disableAnimation={true}
        onClose={onClose}
      />
    )

    // The modal is revealed immediately because animation is disabled.
    // It should render both faces correctly based on raw values
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders percentile 10 as 00 and 0', () => {
    const built: BuiltRoll = {
      formula: 'd%',
      total: 100,
      rolls: [100],
      breakdown: [],
      modifier: 0,
      percentileFaces: [10, 10],
    }

    render(
      <DiceRollOverlay
        built={built}
        disableAnimation={true}
        onClose={onClose}
      />
    )

    expect(screen.getByText('00')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    // both faces of a natural 100 carry the d% tag, no die-face SVG
    expect(screen.getAllByTestId('die-readout-tag').map(el => el.textContent)).toEqual(['d%', 'd%'])
    expect(screen.getByRole('dialog').querySelectorAll('svg')).toHaveLength(0)
  })

  it('renders breakdown of multiple dice', () => {
    const built: BuiltRoll = {
      formula: '1d20 + 1d6',
      total: 21,
      rolls: [15, 6],
      breakdown: [
        { sides: 20, value: 15 },
        { sides: 6, value: 6 },
      ],
      modifier: 0,
    }

    render(
      <DiceRollOverlay
        built={built}
        disableAnimation={true}
        onClose={onClose}
      />
    )

    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('renders an unmapped die size through the same numeric chip path', () => {
    const built: BuiltRoll = {
      formula: '1d3',
      total: 2,
      rolls: [2],
      breakdown: [
        { sides: 3, value: 2 }, // No dedicated icon for d3
      ],
      modifier: 0,
    }

    render(
      <DiceRollOverlay
        built={built}
        disableAnimation={true}
        onClose={onClose}
      />
    )

    // One numeric chip with the value and a d3 size tag — no distinct "fallback" box.
    expect(screen.queryByTestId('fallback-die')).not.toBeInTheDocument()
    expect(screen.getByTestId('die-face')).toHaveTextContent('2')
    expect(screen.getByText('d3')).toBeInTheDocument()
    expect(screen.getByText('1d3')).toBeInTheDocument()
  })
})
