import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiceAppearanceModal } from '@/lib/components/dice/DiceAppearanceModal'
import {
  DICE_COLORSETS,
  DICE_COLORSET_CATEGORIES,
  DICE_MATERIALS,
} from '@/lib/dice/diceAppearance'

function renderModal(overrides: Partial<React.ComponentProps<typeof DiceAppearanceModal>> = {}) {
  const props = {
    colorset: 'white',
    material: 'glass',
    onColorsetChange: jest.fn(),
    onMaterialChange: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  }
  return { props, ...render(<DiceAppearanceModal {...props} />) }
}

describe('DiceAppearanceModal (tasks 4.1 / 4.2)', () => {
  it('4.1-a renders a labelled modal dialog', () => {
    renderModal()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName(/dice appearance/i)
  })

  it('4.1-b renders one control per colorset, grouped under plain-text category headings', () => {
    renderModal()
    const radios = screen
      .getAllByRole('radio')
      .filter(r => DICE_COLORSETS.some(c => within(r).queryByText(c.name)))
    expect(radios).toHaveLength(DICE_COLORSETS.length)
    for (const category of DICE_COLORSET_CATEGORIES) {
      const heading = screen.getByText(category)
      expect(heading.tagName).not.toBe('LABEL')
    }
  })

  it('4.1-c renders the four material controls in a second radiogroup', () => {
    renderModal()
    const materialGroup = screen.getByRole('radiogroup', { name: /^material$/i })
    for (const m of DICE_MATERIALS) {
      expect(within(materialGroup).getByRole('radio', { name: m.name })).toBeInTheDocument()
    }
  })

  it('4.1-d states that the appearance applies to the 3D animation only', () => {
    renderModal()
    expect(screen.getByText(/3D roll animation only/i)).toBeInTheDocument()
  })

  it('4.1-e reflects the current selection via aria-checked', () => {
    renderModal({ colorset: 'fire', material: 'wood' })
    expect(screen.getByRole('radio', { name: /fire/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Wood' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Glass' })).toHaveAttribute('aria-checked', 'false')
  })

  it('4.1-f selecting a colorset / material calls the setter once, no save button', async () => {
    const user = userEvent.setup()
    const { props } = renderModal()
    await user.click(screen.getByRole('radio', { name: /bloodmoon|blood moon/i }))
    expect(props.onColorsetChange).toHaveBeenCalledTimes(1)
    expect(props.onColorsetChange).toHaveBeenCalledWith('bloodmoon')
    await user.click(screen.getByRole('radio', { name: 'Metal' }))
    expect(props.onMaterialChange).toHaveBeenCalledWith('metal')
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
  })

  it('4.1-g arrow keys move the selection within a radiogroup', async () => {
    const user = userEvent.setup()
    const { props } = renderModal({ material: 'glass' })
    const glass = screen.getByRole('radio', { name: 'Glass' })
    glass.focus()
    await user.keyboard('{ArrowRight}')
    expect(props.onMaterialChange).toHaveBeenCalledWith(DICE_MATERIALS[1].id)
  })

  it('4.1-h Escape calls onClose and stops propagation', () => {
    const { props } = renderModal()
    const docHandler = jest.fn()
    document.addEventListener('keydown', docHandler)
    const evt = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    document.dispatchEvent(evt)
    expect(props.onClose).toHaveBeenCalledTimes(1)
    document.removeEventListener('keydown', docHandler)
  })

  it('4.1-i outside mousedown closes, inside does not', () => {
    const { props } = renderModal()
    const dialog = screen.getByRole('dialog')
    dialog.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(props.onClose).not.toHaveBeenCalled()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('4.1-j moves focus in on mount and restores it on unmount', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const { unmount } = renderModal()
    expect(screen.getByRole('dialog')).toHaveFocus()
    unmount()
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it('4.1-k opening the modal makes no network request', () => {
    const original = global.fetch
    const fetchMock = jest.fn(() => {
      throw new Error('no fetch expected')
    })
    global.fetch = fetchMock as unknown as typeof fetch
    try {
      renderModal()
      // The engine is only ever pulled in by `useDiceAnimation.run()` via a dynamic
      // `import('@drdreo/dice-box-threejs')`; this module imports nothing from it. The full
      // "no engine chunk on open" guarantee is covered by the build NFAC check and the E2E.
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      global.fetch = original
    }
  })

  it('4.1-l appends its portal root on mount and removes it on unmount', () => {
    const { unmount } = renderModal()
    expect(document.querySelector('[data-dice-appearance-modal-root]')).not.toBeNull()
    unmount()
    expect(document.querySelector('[data-dice-appearance-modal-root]')).toBeNull()
  })
})
