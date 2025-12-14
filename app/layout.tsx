import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'D&D Session Combat Tracker',
  description: 'Combat tracker and encounter manager for D&D sessions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const buildVersion = process.env.BUILD_VERSION || '1.0.0'
  
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <footer className="bg-gray-950 border-t border-gray-800 py-3 px-4 text-center text-xs text-gray-500">
          v{buildVersion}
        </footer>
      </body>
    </html>
  )
}
