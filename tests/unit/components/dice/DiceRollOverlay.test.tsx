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

  it('renders fallback for unsupported die types gracefully', () => {
    const built: BuiltRoll = {
      formula: '1d3',
      total: 2,
      rolls: [2],
      breakdown: [
        { sides: 3, value: 2 }, // No icon mapped for d3
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

    // It should fallback to generic text container instead of throwing
    expect(screen.getByTestId('fallback-die')).toHaveTextContent('2')
    expect(screen.getByText('1d3')).toBeInTheDocument()
  })
})
