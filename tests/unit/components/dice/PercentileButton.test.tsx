import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PercentileButton } from '@/lib/components/dice/PercentileButton'

describe('PercentileButton', () => {
  it('renders one control with the d% glyph, no count badge, no remove control', () => {
    render(<PercentileButton onRoll={jest.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName(/percentile|d%/i)
    expect(screen.getByText('d%')).toBeInTheDocument()
    expect(screen.queryByText(/^×/)).toBeNull()
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull()
  })

  it('fires onRoll once per click', async () => {
    const user = userEvent.setup()
    const onRoll = jest.fn()
    render(<PercentileButton onRoll={onRoll} />)
    await user.click(screen.getByRole('button'))
    expect(onRoll).toHaveBeenCalledTimes(1)
  })

  it('renders no title attribute', () => {
    const { container } = render(<PercentileButton onRoll={jest.fn()} />)
    expect(container.querySelector('[title]')).toBeNull()
  })

  it('is inert when disabled', async () => {
    const user = userEvent.setup()
    const onRoll = jest.fn()
    render(<PercentileButton onRoll={onRoll} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
    await user.click(screen.getByRole('button'))
    expect(onRoll).not.toHaveBeenCalled()
  })
})
