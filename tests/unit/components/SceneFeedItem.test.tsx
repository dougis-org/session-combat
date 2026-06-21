import { render, screen, fireEvent } from '@testing-library/react'
import { SceneFeedItem } from '@/lib/components/SceneFeedItem'
import type { CampaignMessage } from '@/lib/types'

const CAMPAIGN_ID = 'camp-1'

function makeMsg(overrides: Partial<CampaignMessage> = {}): CampaignMessage {
  return {
    id: 'msg-1',
    campaignId: CAMPAIGN_ID,
    senderId: 'u1',
    senderName: 'DM',
    text: '',
    visibility: { scope: 'group' },
    createdAt: new Date(),
    kind: 'scene',
    ...overrides,
  }
}

function renderItem(msg: CampaignMessage) {
  return render(<SceneFeedItem message={msg} campaignId={CAMPAIGN_ID} />)
}

// T4-1
it('scene with attachmentId renders <img> with correct src', () => {
  renderItem(makeMsg({ attachmentId: 'att-abc' }))
  const img = screen.getByRole('img', { name: /scene image/i })
  expect(img).toHaveAttribute('src', `/api/campaigns/${CAMPAIGN_ID}/attachments/att-abc`)
})

// T4-2
it('scene with text renders caption', () => {
  renderItem(makeMsg({ text: 'The dungeon entrance' }))
  expect(screen.getByText('The dungeon entrance')).toBeInTheDocument()
})

// T4-3
it('scene with image only: <img> present; no caption paragraph', () => {
  renderItem(makeMsg({ attachmentId: 'att-abc', text: '' }))
  expect(screen.getByRole('img', { name: /scene image/i })).toBeInTheDocument()
  // Empty text means no <p> caption element
  expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
})

// T4-4
it('scene with caption only: caption present; no <img>', () => {
  renderItem(makeMsg({ text: 'Caption only', attachmentId: undefined }))
  expect(screen.getByText('Caption only')).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})

// T4-5
it('clicking image calls showModal() on the dialog', () => {
  const showModalSpy = jest.spyOn(HTMLDialogElement.prototype, 'showModal')
  renderItem(makeMsg({ attachmentId: 'att-abc' }))
  fireEvent.click(screen.getByRole('img', { name: /scene image/i }))
  expect(showModalSpy).toHaveBeenCalledTimes(1)
  showModalSpy.mockRestore()
})

// T4-6
it('clicking the dialog backdrop calls close()', () => {
  const closeSpy = jest.spyOn(HTMLDialogElement.prototype, 'close')
  renderItem(makeMsg({ attachmentId: 'att-abc' }))
  const dialog = document.querySelector('dialog')!
  // Simulate a click where the target is the dialog itself
  fireEvent.click(dialog, { target: dialog })
  expect(closeSpy).toHaveBeenCalledTimes(1)
  closeSpy.mockRestore()
})

// T4-7
it('image onError: shows placeholder; caption still visible if present', () => {
  renderItem(makeMsg({ attachmentId: 'att-abc', text: 'Caption here' }))
  // alt is 'Caption here' since text is non-empty
  const img = screen.getByRole('img', { name: 'Caption here' })
  fireEvent.error(img)
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.getByText('Image unavailable')).toBeInTheDocument()
  expect(screen.getByText('Caption here')).toBeInTheDocument()
})
