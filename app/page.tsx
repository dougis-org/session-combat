'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">D&D Session Combat Tracker</h1>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link href="/encounters" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition">
            <h2 className="text-2xl font-semibold mb-2">Encounters</h2>
            <p className="text-gray-400">Manage encounters and monsters</p>
          </Link>

          <Link href="/players" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition">
            <h2 className="text-2xl font-semibold mb-2">Players</h2>
            <p className="text-gray-400">Manage player characters and stats</p>
          </Link>

          <Link href="/combat" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition">
            <h2 className="text-2xl font-semibold mb-2">Combat Tracker</h2>
            <p className="text-gray-400">Run combat sessions with initiative tracking</p>
          </Link>
        </div>

        <div className="mt-12 text-center text-gray-400">
          <p>A simple combat tracker for D&D sessions</p>
        </div>
      </div>
    </div>
  );
}
