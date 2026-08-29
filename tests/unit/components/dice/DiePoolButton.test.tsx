import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiePoolButton } from '@/lib/components/dice/DiePoolButton'
import { MAX_PER_DIE } from '@/lib/utils/dice'

function setup(props: Partial<React.ComponentProps<typeof DiePoolButton>> = {}) {
  const onAdd = jest.fn()
  const onRemove = jest.fn()
  render(<DiePoolButton sides={6} count={2} onAdd={onAdd} onRemove={onRemove} {...props} />)
  return { onAdd, onRemove }
}

describe('DiePoolButton', () => {
  it('renders remove/add controls named for the die size, the glyph, and the count badge', () => {
    setup({ sides: 8, count: 3 })
    expect(screen.getByRole('button', { name: 'Remove d8' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add d8' })).toBeInTheDocument()
    expect(screen.getByText('d8')).toBeInTheDocument()
    expect(screen.getByText('×3')).toBeInTheDocument()
  })

  it('fires onAdd / onRemove with the die size', async () => {
    const user = userEvent.setup()
    const { onAdd, onRemove } = setup({ sides: 20, count: 1 })
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Remove d20' }))
    expect(onAdd).toHaveBeenCalledWith(20)
    expect(onRemove).toHaveBeenCalledWith(20)
  })

  it('disables the add control at MAX_PER_DIE', () => {
    setup({ count: MAX_PER_DIE })
    expect(screen.getByRole('button', { name: 'Add d6' })).toBeDisabled()
  })

  it('disables both controls when disabled is set', () => {
    setup({ disabled: true })
    expect(screen.getByRole('button', { name: 'Add d6' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove d6' })).toBeDisabled()
  })

  it('renders no title attribute on any control', () => {
    const { container } = render(
      <DiePoolButton sides={6} count={0} onAdd={jest.fn()} onRemove={jest.fn()} />,
    )
    expect(container.querySelector('[title]')).toBeNull()
  })
})
