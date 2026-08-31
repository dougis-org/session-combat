import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { DiceRollOverlay, MODAL_REVEAL_FALLBACK_MS } from '@/lib/components/dice/DiceRollOverlay'

const built: BuiltRoll = {
  formula: '3d6+2', rolls: [3, 4, 5], total: 14,
  breakdown: [{ sides: 6, value: 3 }, { sides: 6, value: 4 }, { sides: 6, value: 5 }],
  modifier: 2,
}

/** Stands in for the FAB panel: uses a document-level Escape/outside-click close like useDicePoolState. */
function PanelStub() {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onDown() {
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [])
  return open ? <div data-testid="panel-stub">panel</div> : null
}

describe('DiceRollOverlay', () => {
  it('renders into a document.body child, not inside the caller subtree', () => {
    const { container } = render(
      <DiceRollOverlay built={built} disableAnimation={false} animationSettled onClose={jest.fn()} />,
    )
    const root = document.body.querySelector('[data-dice-roll-overlay-root]')
    expect(root).toBeInTheDocument()
    expect(container.contains(screen.getByRole('dialog'))).toBe(false)
  })

  it('total modal displays built.total once the animation settles', () => {
    render(<DiceRollOverlay built={built} disableAnimation={false} animationSettled onClose={jest.fn()} />)
    expect(screen.getByRole('dialog')).toHaveTextContent('14')
  })

  it('Escape closes only the overlay — the panel stub stays mounted', () => {
    const onClose = jest.fn()
    function Harness() {
      const [showOverlay, setShowOverlay] = useState(true)
      return (
        <>
          <PanelStub />
          {showOverlay && (
            <DiceRollOverlay
              built={built}
              disableAnimation
              onClose={() => {
                onClose()
                setShowOverlay(false)
              }}
            />
          )}
        </>
      )
    }
    render(<Harness />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' })
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('panel-stub')).toBeInTheDocument()
  })

  it('outside click closes only the overlay — the panel stub stays mounted', () => {
    function Harness() {
      const [showOverlay, setShowOverlay] = useState(true)
      return (
        <>
          <PanelStub />
          {showOverlay && (
            <DiceRollOverlay built={built} disableAnimation onClose={() => setShowOverlay(false)} />
          )}
        </>
      )
    }
    render(<Harness />)
    act(() => {
      fireEvent.mouseDown(document.body)
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('panel-stub')).toBeInTheDocument()
  })

  it('a click inside the modal does not close the overlay', () => {
    const onClose = jest.fn()
    render(<DiceRollOverlay built={built} disableAnimation onClose={onClose} />)
    act(() => {
      fireEvent.mouseDown(screen.getByRole('dialog'))
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('a re-render with a new built roll shows exactly one overlay (never stacked)', () => {
    const { rerender } = render(
      <DiceRollOverlay built={built} disableAnimation onClose={jest.fn()} />,
    )
    rerender(
      <DiceRollOverlay built={{ ...built, total: 99 }} disableAnimation onClose={jest.fn()} />,
    )
    expect(document.body.querySelectorAll('[data-dice-roll-overlay-root]')).toHaveLength(1)
    expect(screen.getByRole('dialog')).toHaveTextContent('99')
  })

  it('disableAnimation → total modal shown, no canvas node', () => {
    render(<DiceRollOverlay built={built} disableAnimation onClose={jest.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByTestId('dice-roll-canvas')).not.toBeInTheDocument()
  })

  it('animation enabled → canvas node rendered and onCanvasReady called with it', () => {
    const onCanvasReady = jest.fn()
    render(
      <DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} onCanvasReady={onCanvasReady} />,
    )
    const canvas = screen.getByTestId('dice-roll-canvas')
    expect(canvas).toBeInTheDocument()
    expect(onCanvasReady).toHaveBeenCalledWith(canvas)
    expect(onCanvasReady).toHaveBeenCalledTimes(1)
  })
})

describe('DiceRollOverlay — bounded, centered canvas region', () => {
  it('mounts the canvas as a bounded element, not a full-viewport inset-0 layer', () => {
    render(<DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />)
    const canvas = screen.getByTestId('dice-roll-canvas')
    expect(canvas).toHaveAttribute('id', 'dice-roll-canvas')
    expect(canvas.className).not.toContain('inset-0')
    expect(canvas.className).toContain('pointer-events-none')
  })

  it('lays the canvas and the revealed modal out as siblings in a centered stack, canvas first', () => {
    render(<DiceRollOverlay built={built} disableAnimation={false} animationSettled onClose={jest.fn()} />)
    const canvas = screen.getByTestId('dice-roll-canvas')
    const modal = screen.getByRole('dialog')
    expect(canvas.parentElement).toBe(modal.parentElement)
    const container = canvas.parentElement!
    expect(container.className).toContain('flex')
    expect(container.className).toContain('items-center')
    expect(canvas.compareDocumentPosition(modal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('DiceRollOverlay — modal gated on animation completion', () => {
  it('keeps the modal hidden while the tumble is in progress', () => {
    render(<DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('dice-roll-canvas')).toBeInTheDocument()
  })

  it('reveals the modal when the completion signal fires', () => {
    const { rerender } = render(
      <DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(<DiceRollOverlay built={built} disableAnimation={false} animationSettled onClose={jest.fn()} />)
    expect(screen.getByRole('dialog')).toHaveTextContent('14')
  })

  it('reveals the modal immediately when unsupported and collapses the canvas band (host stays mounted)', () => {
    render(
      <DiceRollOverlay built={built} disableAnimation={false} animationStatus="unsupported" onClose={jest.fn()} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // host stays in the DOM (dice-box has no destroy) but reserves no layout space
    const canvas = screen.getByTestId('dice-roll-canvas')
    expect(canvas).toHaveClass('hidden')
    expect(canvas.className).not.toContain('h-[38vh]')
  })

  it('reveals the modal via the fallback timeout, keeping the canvas host mounted but collapsed', () => {
    jest.useFakeTimers()
    try {
      render(<DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      act(() => {
        jest.advanceTimersByTime(MODAL_REVEAL_FALLBACK_MS)
      })
      expect(screen.getByRole('dialog')).toHaveTextContent('14')
      expect(screen.getByTestId('dice-roll-canvas')).toHaveClass('hidden')
    } finally {
      jest.useRealTimers()
    }
  })

  it('exposes the roll result to assistive tech via a live region populated after mount', async () => {
    render(<DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    // empty on first commit so a real screen reader treats the fill-in as an announcement
    expect(status).toHaveTextContent('')
    await waitFor(() => expect(status).toHaveTextContent('3d6+2 rolled 14'))
  })

  it('keeps the canvas host mounted (just hidden) if animation is disabled mid-tumble', () => {
    const { rerender } = render(
      <DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />,
    )
    expect(screen.getByTestId('dice-roll-canvas')).toBeInTheDocument()
    rerender(<DiceRollOverlay built={built} disableAnimation onClose={jest.fn()} />)
    const canvas = screen.getByTestId('dice-roll-canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveClass('hidden')
  })

  it('names the revealed dialog with the rolled total via aria-describedby', () => {
    render(<DiceRollOverlay built={built} disableAnimation animationSettled onClose={jest.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-describedby', 'dice-roll-result-total')
    expect(document.getElementById('dice-roll-result-total')).toHaveTextContent('14')
  })

  it('a click on the dice area during the tumble dismisses neither the overlay nor the panel behind it', () => {
    const onClose = jest.fn()
    render(
      <>
        <PanelStub />
        <DiceRollOverlay built={built} disableAnimation={false} onClose={onClose} />
      </>,
    )
    // modal not revealed yet — clicking the canvas region must not close the overlay,
    // and must not leak to the panel's own document-level close handler.
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('dice-roll-canvas'))
    })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByTestId('panel-stub')).toBeInTheDocument()
    // clicking the surrounding backdrop still closes the overlay
    act(() => {
      fireEvent.mouseDown(document.body)
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('re-gates the modal when a new built roll arrives', () => {
    const { rerender } = render(
      <DiceRollOverlay built={built} disableAnimation={false} animationSettled onClose={jest.fn()} />,
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('14')
    rerender(
      <DiceRollOverlay
        built={{ ...built, total: 20 }}
        disableAnimation={false}
        animationSettled={false}
        onClose={jest.fn()}
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('moves focus into the dialog once it is revealed', () => {
    const { rerender } = render(
      <DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />,
    )
    rerender(<DiceRollOverlay built={built} disableAnimation={false} animationSettled onClose={jest.fn()} />)
    expect(screen.getByRole('dialog')).toHaveFocus()
  })

  it('pulls focus off the opener as soon as it mounts, before the modal reveals', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    render(<DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).not.toHaveFocus()
    opener.remove()
  })

  it('restores focus to the opener even when dismissed before the modal is revealed', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const { unmount } = render(
      <DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    unmount()
    expect(opener).toHaveFocus()
    opener.remove()
  })

  describe('per-die readout', () => {
    it('renders every die value and the total for a small pool', () => {
      render(<DiceRollOverlay built={built} disableAnimation animationSettled onClose={jest.fn()} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveTextContent('3')
      expect(dialog).toHaveTextContent('4')
      expect(dialog).toHaveTextContent('5')
      expect(screen.getByText('14')).toBeInTheDocument()
      expect(screen.queryByTestId('dice-readout-remainder')).not.toBeInTheDocument()
    })

    it('caps at DICE_ANIM_CAP dice and shows a "+N more" indicator for a large pool; total is the full-pool total', () => {
      const breakdown = Array.from({ length: 120 }, () => ({ sides: 6, value: 4 }))
      const big: BuiltRoll = {
        formula: '120d6', rolls: breakdown.map(d => d.value), total: 480, breakdown, modifier: 0,
      }
      render(<DiceRollOverlay built={big} disableAnimation animationSettled onClose={jest.fn()} />)
      // 15 icon dice rendered (each glyph superimposes its value)
      const dialog = screen.getByRole('dialog')
      expect(dialog.querySelectorAll('svg').length).toBe(15)
      expect(screen.getByTestId('dice-readout-remainder')).toHaveTextContent('+105 more')
      expect(screen.getByText('480')).toBeInTheDocument()
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
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveTextContent('3')
      expect(dialog).toHaveTextContent('4')
      expect(dialog).toHaveTextContent('5')
    })

    it('shows the two d10 faces and decoded total for a percentile roll', () => {
      const pct: BuiltRoll = {
        formula: 'd%', rolls: [42], total: 42, breakdown: [], modifier: 0, percentileFaces: [4, 2],
      }
      render(<DiceRollOverlay built={pct} disableAnimation animationSettled onClose={jest.fn()} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveTextContent('40')
      expect(dialog).toHaveTextContent('2')
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })
})
