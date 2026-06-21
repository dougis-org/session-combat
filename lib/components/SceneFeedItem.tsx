'use client'

import { useRef, useState } from 'react'
import type { CampaignMessage } from '@/lib/types'

interface SceneFeedItemProps {
  message: CampaignMessage
  campaignId: string
}

export function SceneFeedItem({ message, campaignId }: SceneFeedItemProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [imgError, setImgError] = useState(false)

  const imgSrc = `/api/campaigns/${campaignId}/attachments/${message.attachmentId}`

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close()
    }
  }

  return (
    <div className="border border-yellow-800/40 bg-yellow-900/10 rounded p-2 flex flex-col gap-1">
      <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">Scene</span>
      {message.attachmentId && (
        imgError ? (
          <div className="text-xs text-gray-400 italic">Image unavailable</div>
        ) : (
          <img
            src={imgSrc}
            alt={message.text || 'Scene image'}
            className="max-h-48 w-auto cursor-pointer rounded"
            onClick={() => dialogRef.current?.showModal()}
            onError={() => setImgError(true)}
          />
        )
      )}
      {message.text && (
        <p className="text-sm text-gray-200">{message.text}</p>
      )}
      {message.attachmentId && (
        <dialog
          ref={dialogRef}
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <img
            src={imgSrc}
            alt={message.text || 'Scene image'}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </dialog>
      )}
    </div>
  )
}
