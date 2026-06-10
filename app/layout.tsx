// app/layout.tsx — drop-in replacement.
// Adds IBM Plex (Sans / Mono / Serif) via next/font for zero-CLS, self-hosted fonts.
// Existing footer / version / metadata behavior is preserved exactly.

import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif } from 'next/font/google'
import { NavBar } from '@/lib/components/NavBar'
import { CampaignChat } from '@/lib/components/CampaignChat'
import './globals.css'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--sc-font-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--sc-font-mono',
  display: 'swap',
})

const plexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--sc-font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'D&D Session Combat Tracker',
  description: 'Combat tracker and encounter manager for D&D sessions',
  icons: {
    icon: '/favicon.svg',
  },
}

async function getVersionData() {
  try {
    const versionData = await import('@/lib/version.json')
    return versionData.default || versionData
  } catch (error) {
    console.error('Failed to load version data:', error)
    return {
      version: '0.0.0',
      buildDate: new Date().toISOString(),
      buildNumber: 0,
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const versionData = await getVersionData()
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  // Wire all three variables onto <html> so global utilities and
  // mono/serif overrides work anywhere in the tree.
  const fontVars = `${plexSans.variable} ${plexMono.variable} ${plexSerif.variable}`

  return (
    <html lang="en" className={fontVars}>
      <body className="flex flex-col h-screen overflow-hidden font-sans">
        <NavBar />
        <div className="flex-1 overflow-auto">{children}</div>
        <footer className="flex-shrink-0 bg-gray-950 border-t border-gray-800 py-2 px-4 text-center text-xs text-gray-500">
          <div className="flex justify-center items-center gap-3 font-mono">
            <span>v{versionData.version}</span>
            <span>•</span>
            <span>{formatDate(versionData.buildDate)}</span>
          </div>
        </footer>
        <CampaignChat />
      </body>
    </html>
  )
}
