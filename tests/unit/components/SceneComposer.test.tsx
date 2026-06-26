import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SceneComposer } from '@/lib/components/SceneComposer'
import type { CampaignMessage } from '@/lib/types'

const CAMPAIGN_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa'
const onSuccess = jest.fn()
const onCancel = jest.fn()

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

const validJpeg = makeFile('photo.jpg', 'image/jpeg', 1024)
const oversizedFile = makeFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024)
const pdfFile = makeFile('doc.pdf', 'application/pdf', 512)

let fetchSpy: jest.Mock
const originalFetch = global.fetch

function setupFetch(overrides?: {
  attachmentsOk?: boolean
  attachmentsBody?: object
  messagesOk?: boolean
  messagesBody?: object
}) {
  const {
    attachmentsOk = true,
    attachmentsBody = { attachmentId: 'att-123' },
    messagesOk = true,
    messagesBody = { id: 'msg-1', kind: 'scene', attachmentId: 'att-123', text: '', visibility: { scope: 'group' }, campaignId: CAMPAIGN_ID, senderId: 'u1', senderName: 'DM', createdAt: new Date().toISOString() },
  } = overrides ?? {}

  fetchSpy = jest.fn().mockImplementation((url: string) => {
    if ((url as string).includes('/attachments')) {
      return Promise.resolve({
        ok: attachmentsOk,
        json: () => Promise.resolve(attachmentsBody),
      })
    }
    if ((url as string).includes('/messages')) {
      return Promise.resolve({
        ok: messagesOk,
        json: () => Promise.resolve(messagesBody),
      })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
  global.fetch = fetchSpy as unknown as typeof global.fetch
}

beforeEach(() => {
  jest.clearAllMocks()
  setupFetch()
})

afterEach(() => {
  global.fetch = originalFetch
})

function renderComposer() {
  return render(
    <SceneComposer campaignId={CAMPAIGN_ID} onSuccess={onSuccess} onCancel={onCancel} />
  )
}

// T3-1
it('Send button is disabled when no file and no caption', () => {
  renderComposer()
  expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
})

// T3-2
it('oversized file shows error and Send remains disabled', async () => {
  const user = userEvent.setup()
  renderComposer()
  const input = screen.getByLabelText('Scene image')
  await user.upload(input, oversizedFile)
  expect(screen.getByRole('alert')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
})

// T3-3
it('invalid file type shows error and Send remains disabled', async () => {
  renderComposer()
  const input = screen.getByLabelText('Scene image')
  // Use fireEvent to bypass userEvent's accept filter
  fireEvent.change(input, { target: { files: [pdfFile] } })
  expect(screen.getByRole('alert')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
})

// T3-4 (implicit: valid file enables Send)
it('valid JPEG file clears errors and enables Send button', async () => {
  const user = userEvent.setup()
  renderComposer()
  const input = screen.getByLabelText('Scene image')
  await user.upload(input, validJpeg)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
})

// T3-5 (initial state — no file, no caption)
it('Send button stays disabled when no file and no caption', () => {
  renderComposer()
  expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
})

// T3-6
it('full success: calls /attachments then /messages; onSuccess called with returned message', async () => {
  const user = userEvent.setup()
  renderComposer()
  const input = screen.getByLabelText('Scene image')
  await user.upload(input, validJpeg)
  await user.type(screen.getByLabelText('Scene caption'), 'My caption')
  await user.click(screen.getByRole('button', { name: /send/i }))

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  const calls = fetchSpy.mock.calls.map(c => c[0] as string)
  const attachIdx = calls.findIndex(u => u.includes('/attachments'))
  const msgIdx = calls.findIndex(u => u.includes('/messages'))
  expect(attachIdx).toBeGreaterThanOrEqual(0)
  expect(msgIdx).toBeGreaterThan(attachIdx)

  const msgCall = fetchSpy.mock.calls[msgIdx]
  const body = JSON.parse(msgCall[1].body as string)
  expect(body.kind).toBe('scene')
  expect(body.attachmentId).toBe('att-123')
  expect(body.visibility).toEqual({ scope: 'group' })
})

// T3-7
it('upload failure shows error; /messages NOT called; onSuccess NOT called', async () => {
  setupFetch({ attachmentsOk: false, attachmentsBody: { error: 'Upload failed' } })
  const user = userEvent.setup()
  renderComposer()
  await user.upload(screen.getByLabelText('Scene image'), validJpeg)
  await user.click(screen.getByRole('button', { name: /send/i }))

  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  expect(onSuccess).not.toHaveBeenCalled()
  const calls = fetchSpy.mock.calls.map(c => c[0] as string)
  expect(calls.some(u => u.includes('/messages'))).toBe(false)
})

// T3-8
it('message failure after upload shows error; onSuccess NOT called', async () => {
  setupFetch({ messagesOk: false, messagesBody: { error: 'Server error' } })
  const user = userEvent.setup()
  renderComposer()
  await user.upload(screen.getByLabelText('Scene image'), validJpeg)
  await user.click(screen.getByRole('button', { name: /send/i }))

  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  expect(onSuccess).not.toHaveBeenCalled()
})

// T3-9
it('Cancel button calls onCancel without making any fetch calls', async () => {
  const user = userEvent.setup()
  renderComposer()
  await user.click(screen.getByRole('button', { name: /cancel/i }))
  expect(onCancel).toHaveBeenCalledTimes(1)
  expect(fetchSpy).not.toHaveBeenCalled()
})

// T3-10: caption-only (no file) enables Send and skips /attachments
it('caption-only scene enables Send and posts directly to /messages without upload', async () => {
  const user = userEvent.setup()
  renderComposer()
  await user.type(screen.getByLabelText('Scene caption'), 'Just text, no image')
  expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()

  await user.click(screen.getByRole('button', { name: /send/i }))
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))

  const calls = fetchSpy.mock.calls.map(c => c[0] as string)
  expect(calls.some(u => u.includes('/attachments'))).toBe(false)
  expect(calls.some(u => u.includes('/messages'))).toBe(true)
  const msgCall = fetchSpy.mock.calls.find(c => (c[0] as string).includes('/messages'))!
  const body = JSON.parse(msgCall[1].body as string)
  expect(body.kind).toBe('scene')
  expect(body.attachmentId).toBeUndefined()
  expect(body.text).toBe('Just text, no image')
})

// onSuccess receives the message
it('onSuccess receives the message returned by /messages', async () => {
  const returnedMsg: Partial<CampaignMessage> = {
    id: 'msg-99',
    kind: 'scene',
    attachmentId: 'att-123',
    text: '',
  }
  setupFetch({ messagesBody: returnedMsg })
  const user = userEvent.setup()
  renderComposer()
  await user.upload(screen.getByLabelText('Scene image'), validJpeg)
  await user.click(screen.getByRole('button', { name: /send/i }))

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg-99' }))
  })
})
