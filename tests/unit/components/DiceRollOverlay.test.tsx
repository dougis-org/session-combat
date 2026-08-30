import { render, screen, fireEvent, act } from '@testing-library/react'
import { useEffect, useState } from 'react'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { DiceRollOverlay } from '@/lib/components/dice/DiceRollOverlay'

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
    const { container } = render(<DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />)
    const root = document.body.querySelector('[data-dice-roll-overlay-root]')
    expect(root).toBeInTheDocument()
    expect(container.contains(screen.getByRole('dialog'))).toBe(false)
  })

  it('total modal displays built.total', () => {
    render(<DiceRollOverlay built={built} disableAnimation={false} onClose={jest.fn()} />)
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
  })
})
