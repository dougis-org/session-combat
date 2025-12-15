import type { Metadata } from 'next'
import './globals.css'
import versionData from '@/lib/version.json'

export const metadata: Metadata = {
  title: 'D&D Session Combat Tracker',
  description: 'Combat tracker and encounter manager for D&D sessions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
  
  return (
    <html lang="en">
      <body className="flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-auto">{children}</div>
        <footer className="flex-shrink-0 bg-gray-950 border-t border-gray-800 py-2 px-4 text-center text-xs text-gray-500">
          <div className="flex justify-center items-center gap-3">
            <span>v{versionData.version}</span>
            <span>•</span>
            <span>{formatDate(versionData.buildDate)}</span>
            <span>•</span>
            <span>Build #{versionData.buildNumber}</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
