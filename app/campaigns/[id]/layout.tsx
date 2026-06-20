'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CampaignChat } from '@/lib/components/CampaignChat'

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetch(`/api/campaigns/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled) setActiveSessionId(data?.activeSessionId ?? null)
      })
      .catch(() => { /* leave null */ })
    return () => { cancelled = true }
  }, [id])

  return (
    <>
      {children}
      <CampaignChat key={id} campaignId={id} activeSessionId={activeSessionId} />
    </>
  )
}
