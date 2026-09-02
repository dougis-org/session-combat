import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { DiceRollOverlay, MODAL_REVEAL_FALLBACK_MS } from '@/lib/components/dice/DiceRollOverlay'
import { built, PanelStub } from './__helpers__/diceOverlayFixtures'

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
})
