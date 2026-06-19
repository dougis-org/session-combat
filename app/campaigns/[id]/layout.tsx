'use client'

import { useParams } from 'next/navigation'
import { CampaignChat } from '@/lib/components/CampaignChat'

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>()
  return (
    <>
      {children}
      <CampaignChat key={id} campaignId={id} />
    </>
  )
}
