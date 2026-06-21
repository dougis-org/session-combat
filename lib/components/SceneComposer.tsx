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
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFileError('Invalid file type. Please select a JPEG, PNG, WebP, or GIF image.')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError('File exceeds 5 MB limit.')
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
        let currentAttachmentId = uploadedAttachmentId
        if (!currentAttachmentId) {
          const formData = new FormData()
          formData.append('file', file)
          const uploadRes = await fetch(`/api/campaigns/${campaignId}/attachments`, {
            method: 'POST',
            body: formData,
          })
          if (!uploadRes.ok) {
            const uploadData = await uploadRes.json().catch(() => ({})) as { error?: string }
            setSubmitError(uploadData.error ?? 'Upload failed. Please try again.')
            return
          }
          const { attachmentId: id } = await uploadRes.json() as { attachmentId: string }
          currentAttachmentId = id
          setUploadedAttachmentId(id)
        }
        attachmentId = currentAttachmentId
      }

      const msgRes = await fetch(`/api/campaigns/${campaignId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'scene',
          ...(attachmentId ? { attachmentId } : {}),
          text: caption.trim(),
          visibility: { scope: 'group' },
        }),
      })
      if (!msgRes.ok) {
        const msgData = await msgRes.json().catch(() => ({})) as { error?: string }
        setSubmitError(msgData.error ?? 'Failed to post scene. Please try again.')
        return
      }
      const message = await msgRes.json() as CampaignMessage
      onSuccess(message)
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
      />
      {fileError && <p className="text-xs text-red-400" role="alert">{fileError}</p>}
      <textarea
        value={caption}
        onChange={e => setCaption(e.target.value)}
        maxLength={5000}
        rows={2}
        placeholder="Caption (optional)"
        className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1.5 resize-none placeholder-gray-500"
        aria-label="Scene caption"
      />
      {submitError && <p className="text-xs text-red-400" role="alert">{submitError}</p>}
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
