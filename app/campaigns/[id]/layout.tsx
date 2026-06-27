'use client'

import { useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { CampaignChat } from '@/lib/components/CampaignChat'
import Link from 'next/link'

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetch(`/api/campaigns/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled) {
          setActiveSessionId(data?.activeSessionId ?? null)
          setCampaignName(data?.name ?? null)
        }
      })
      .catch(() => { /* leave null */ })
    return () => { cancelled = true }
  }, [id])

  return (
    <>
      {campaignName && (
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-white">{campaignName}</h1>
        </header>
      )}
      <nav className="flex gap-4 mb-6">
        {[
          { label: 'Members', href: `/campaigns/${id}` },
          { label: 'Sessions', href: `/campaigns/${id}/sessions` },
          { label: 'Prompts', href: `/campaigns/${id}/prompts` },
          { label: 'Library', href: `/campaigns/${id}/library` },
        ].map(tab => {
          const isActive = pathname
            ? (tab.href === `/campaigns/${id}` ? pathname === tab.href : pathname.startsWith(tab.href))
            : false;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${isActive ? 'border-b-2 border-blue-400 text-white' : 'text-gray-400'} px-2 py-1`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
      <CampaignChat key={id} campaignId={id} activeSessionId={activeSessionId} />
    </>
  )
}
