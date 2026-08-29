'use client'

import { useEffect, useState } from 'react'
import type { EnrichedMember } from './ChatFeed'

export function useMembers(campaignId: string) {
  const [members, setMembers] = useState<EnrichedMember[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/members`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled && data?.members) {
          setMembers((data.members as EnrichedMember[]).filter(m => m.status === 'active'))
        }
      })
      .catch(() => { /* leave members empty */ })
    return () => { cancelled = true }
  }, [campaignId])

  return members
}
