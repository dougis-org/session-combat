'use client'

import { useRef, useState } from 'react'
import type { CampaignMessage } from '@/lib/types'

interface SceneComposerProps {
  campaignId: string
  onSuccess: (msg: CampaignMessage) => void
  onCancel: () => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function getFileValidationError(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type. Please select a JPEG, PNG, WebP, or GIF image.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File exceeds 5 MB limit.'
  }
  return null
}

async function uploadAttachment(
  campaignId: string,
  file: File,
  cached: string | null
): Promise<{ attachmentId: string } | { error: string }> {
  if (cached) return { attachmentId: cached }
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`/api/campaigns/${campaignId}/attachments`, { method: 'POST', body: formData })
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    return { error: data.error ?? 'Upload failed. Please try again.' }
  }
  const { attachmentId } = await res.json() as { attachmentId: string }
  return { attachmentId }
}

async function postSceneMessage(
  campaignId: string,
  attachmentId: string | null,
  caption: string
): Promise<{ message: CampaignMessage } | { error: string }> {
  const res = await fetch(`/api/campaigns/${campaignId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'scene',
      ...(attachmentId ? { attachmentId } : {}),
      text: caption,
      visibility: { scope: 'group' },
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    return { error: data.error ?? 'Failed to post scene. Please try again.' }
  }
  const message = await res.json() as CampaignMessage
  return { message }
}

export function SceneComposer({ campaignId, onSuccess, onCancel }: SceneComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedAttachmentId, setUploadedAttachmentId] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFileError(null)
    setSubmitError(null)
    setUploadedAttachmentId(null)
    if (!selected) {
      setFile(null)
      return
    }
    const error = getFileValidationError(selected)
    if (error) {
      setFileError(error)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setFile(selected)
  }

  const canSend = !isSubmitting && !fileError && (!!file || caption.trim().length > 0)

  async function handleSend() {
    if (!canSend) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      let attachmentId: string | null = null
      if (file) {
        const uploadResult = await uploadAttachment(campaignId, file, uploadedAttachmentId)
        if ('error' in uploadResult) {
          setSubmitError(uploadResult.error)
          return
        }
        attachmentId = uploadResult.attachmentId
        setUploadedAttachmentId(uploadResult.attachmentId)
      }
      const msgResult = await postSceneMessage(campaignId, attachmentId, caption.trim())
      if ('error' in msgResult) {
        setSubmitError(msgResult.error)
        return
      }
      onSuccess(msgResult.message)
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border border-gray-600 bg-gray-800/80 rounded p-3 flex flex-col gap-2 flex-shrink-0">
      <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">Scene</span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-700 file:text-white hover:file:bg-gray-600"
        aria-label="Scene image"
        aria-describedby={fileError ? 'scene-file-error' : undefined}
      />
      {fileError && <p id="scene-file-error" className="text-xs text-red-400" role="alert">{fileError}</p>}
      <textarea
        value={caption}
        onChange={e => setCaption(e.target.value)}
        maxLength={5000}
        rows={2}
        placeholder="Caption (optional)"
        className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1.5 resize-none placeholder-gray-500"
        aria-label="Scene caption"
      />
      {submitError && <p className="text-xs text-red-400" role="alert" aria-live="assertive">{submitError}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1 rounded"
        >
          {isSubmitting ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
