import { render, screen, act } from '@testing-library/react'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { DiceRollOverlay, MODAL_REVEAL_FALLBACK_MS } from '@/lib/components/dice/DiceRollOverlay'
import { built } from './__helpers__/diceOverlayFixtures'

describe('DiceRollOverlay — per-die readout', () => {
  const mixedPool: BuiltRoll = {
    formula: '2d20 + 1d6', rolls: [14, 2, 5], total: 21,
    breakdown: [{ sides: 20, value: 14 }, { sides: 20, value: 2 }, { sides: 6, value: 5 }],
    modifier: 0,
  }

  it('renders every die value and the total for a small pool', () => {
    render(<DiceRollOverlay built={built} disableAnimation animationSettled onClose={jest.fn()} />)
    const faces = screen.getAllByTestId('die-face').map(el => el.textContent)
    expect(faces).toEqual(['3', '4', '5'])
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.queryByTestId('dice-readout-remainder')).not.toBeInTheDocument()
  })

  it('shows each die value as the dominant element with a visible d{sides} size tag', () => {
    render(<DiceRollOverlay built={mixedPool} disableAnimation animationSettled onClose={jest.fn()} />)
    const faces = screen.getAllByTestId('die-face').map(el => el.textContent)
    expect(faces).toEqual(['14', '2', '5'])
    const tags = screen.getAllByTestId('die-readout-tag').map(el => el.textContent)
    expect(tags).toEqual(['d20', 'd20', 'd6'])
    expect(screen.getByRole('dialog')).toHaveTextContent('21')
  })

  it('renders no die-face SVG graphic and no value-over-icon overlay', () => {
    render(<DiceRollOverlay built={mixedPool} disableAnimation animationSettled onClose={jest.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.querySelectorAll('svg')).toHaveLength(0)
    for (const face of screen.getAllByTestId('die-face')) {
      expect(face.className).not.toContain('absolute')
    }
  })

  it('caps at DICE_ANIM_CAP dice and shows a "+N more" indicator for a large pool; total is the full-pool total', () => {
    const breakdown = Array.from({ length: 120 }, () => ({ sides: 6, value: 4 }))
    const big: BuiltRoll = {
      formula: '120d6', rolls: breakdown.map(d => d.value), total: 480, breakdown, modifier: 0,
    }
    render(<DiceRollOverlay built={big} disableAnimation animationSettled onClose={jest.fn()} />)
    expect(screen.getAllByTestId('die-face')).toHaveLength(15)
    expect(screen.getByRole('dialog').querySelectorAll('svg')).toHaveLength(0)
    expect(screen.getByTestId('dice-readout-remainder')).toHaveTextContent('+105 more')
    expect(screen.getByText('480')).toBeInTheDocument()
  })

  it('shows "+1 more" one die past the cap', () => {
    const breakdown = Array.from({ length: 16 }, () => ({ sides: 6, value: 3 }))
    const pool: BuiltRoll = {
      formula: '16d6', rolls: breakdown.map(d => d.value), total: 48, breakdown, modifier: 0,
    }
    render(<DiceRollOverlay built={pool} disableAnimation animationSettled onClose={jest.fn()} />)
    expect(screen.getAllByTestId('die-face')).toHaveLength(15)
    expect(screen.getByTestId('dice-readout-remainder')).toHaveTextContent('+1 more')
  })

  it('shows no remainder note at exactly DICE_ANIM_CAP dice', () => {
    const breakdown = Array.from({ length: 15 }, () => ({ sides: 6, value: 2 }))
    const pool: BuiltRoll = {
      formula: '15d6', rolls: breakdown.map(d => d.value), total: 30, breakdown, modifier: 0,
    }
    render(<DiceRollOverlay built={pool} disableAnimation animationSettled onClose={jest.fn()} />)
    expect(screen.getAllByTestId('die-face')).toHaveLength(15)
    expect(screen.queryByTestId('dice-readout-remainder')).not.toBeInTheDocument()
  })

  it('is present on the unsupported reveal path', () => {
    render(
      <DiceRollOverlay
        built={built}
        disableAnimation={false}
        animationStatus="unsupported"
        onClose={jest.fn()}
      />,
    )
    const faces = screen.getAllByTestId('die-face').map(el => el.textContent)
    expect(faces).toEqual(['3', '4', '5'])
  })

  it('renders an identical readout across every modal-reveal path', () => {
    const readoutHtml = (ui: Parameters<typeof render>[0]) => {
      const { unmount } = render(ui)
      const html = screen.getAllByTestId('die-readout-chip').map(c => c.outerHTML).join('|')
      unmount()
      return html
    }
    const settled = readoutHtml(
      <DiceRollOverlay built={built} disableAnimation={false} animationSettled onClose={jest.fn()} />,
    )
    const disabled = readoutHtml(
      <DiceRollOverlay built={built} disableAnimation onClose={jest.fn()} />,
    )
    const unsupported = readoutHtml(
      <DiceRollOverlay built={built} disableAnimation={false} animationStatus="unsupported" onClose={jest.fn()} />,
    )
    jest.useFakeTimers()
    let fallback: string
    try {
      const { unmount } = render(
        <DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />,
      )
      act(() => {
        jest.advanceTimersByTime(MODAL_REVEAL_FALLBACK_MS)
      })
      fallback = screen.getAllByTestId('die-readout-chip').map(c => c.outerHTML).join('|')
      unmount()
    } finally {
      jest.useRealTimers()
    }
    expect(disabled).toBe(settled)
    expect(unsupported).toBe(settled)
    expect(fallback).toBe(settled)
  })

  it('5.4-a is byte-identical with a non-default dice appearance stored (instant path is appearance-agnostic)', () => {
    const chips = (ui: Parameters<typeof render>[0]) => {
      const { unmount } = render(ui)
      const html = screen.getAllByTestId('die-readout-chip').map(c => c.outerHTML).join('|')
      unmount()
      return html
    }
    const baseline = chips(
      <DiceRollOverlay built={built} disableAnimation animationSettled onClose={jest.fn()} />,
    )
    localStorage.setItem(
      'sessionCombat:v1:dice-fab-colorset',
      JSON.stringify({ v: 1, data: 'glitterparty', updatedAt: '' }),
    )
    localStorage.setItem(
      'sessionCombat:v1:dice-fab-material',
      JSON.stringify({ v: 1, data: 'wood', updatedAt: '' }),
    )
    const withAppearance = chips(
      <DiceRollOverlay built={built} disableAnimation animationSettled onClose={jest.fn()} />,
    )
    localStorage.clear()
    expect(withAppearance).toBe(baseline)
  })

  it('shows the two d10 faces (d% tagged, no icon) and decoded total for a percentile roll', () => {
    const pct: BuiltRoll = {
      formula: 'd%', rolls: [42], total: 42, breakdown: [], modifier: 0, percentileFaces: [4, 2],
    }
    render(<DiceRollOverlay built={pct} disableAnimation animationSettled onClose={jest.fn()} />)
    const dialog = screen.getByRole('dialog')
    const faces = screen.getAllByTestId('die-face').map(el => el.textContent)
    expect(faces).toEqual(['40', '2'])
    const tags = screen.getAllByTestId('die-readout-tag').map(el => el.textContent)
    expect(tags).toEqual(['d%', 'd%'])
    expect(dialog.querySelectorAll('svg')).toHaveLength(0)
    for (const chip of screen.getAllByTestId('die-readout-chip')) {
      expect(chip.className).not.toContain('mt-2')
    }
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders a natural-100 percentile roll as 00 and 0, both d% tagged with no die-face SVG', () => {
    const pct: BuiltRoll = {
      formula: 'd%', rolls: [100], total: 100, breakdown: [], modifier: 0, percentileFaces: [10, 10],
    }
    render(<DiceRollOverlay built={pct} disableAnimation animationSettled onClose={jest.fn()} />)
    expect(screen.getByText('00')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getAllByTestId('die-readout-tag').map(el => el.textContent)).toEqual(['d%', 'd%'])
    expect(screen.getByRole('dialog').querySelectorAll('svg')).toHaveLength(0)
  })

  it('renders an unmapped die size through the same numeric chip path — no distinct fallback box', () => {
    const d3: BuiltRoll = {
      formula: '1d3', rolls: [2], total: 2, breakdown: [{ sides: 3, value: 2 }], modifier: 0,
    }
    render(<DiceRollOverlay built={d3} disableAnimation animationSettled onClose={jest.fn()} />)
    expect(screen.queryByTestId('fallback-die')).not.toBeInTheDocument()
    expect(screen.getByTestId('die-face')).toHaveTextContent('2')
    expect(screen.getByText('d3')).toBeInTheDocument()
    expect(screen.getByText('1d3')).toBeInTheDocument()
  })
})
