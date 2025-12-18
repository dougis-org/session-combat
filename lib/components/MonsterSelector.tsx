'use client';

import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { MonsterTemplate } from '@/lib/types';

type CreatorFilter = 'all' | 'mine' | 'global' | 'other';

interface MonsterSelectorProps {
  monsters: MonsterTemplate[];
  onSelect: (monster: MonsterTemplate) => void;
  onClose: () => void;
  loading?: boolean;
  userId?: string;
}

export function MonsterSelector({
  monsters,
  onSelect,
  onClose,
  loading = false,
  userId,
}: MonsterSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [creatorFilter, setCreatorFilter] = useState<CreatorFilter>('all');

  // Fuse.js fuzzy search setup
  const fuse = useMemo(
    () =>
      new Fuse(monsters, {
        keys: ['name', 'type', 'description', 'source'],
        threshold: 0.3, // Allow for fuzzy matching
        includeScore: true,
      }),
    [monsters]
  );

  // Perform search and filter
  const filteredMonsters = useMemo(() => {
    let results = monsters;

    // Apply search filter
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery);
      results = searchResults.map(result => result.item);
    }

    // Apply creator filter
    if (creatorFilter === 'mine') {
      results = results.filter(m => m.userId === userId);
    } else if (creatorFilter === 'global') {
      results = results.filter(m => m.userId === 'GLOBAL');
    } else if (creatorFilter === 'other') {
      results = results.filter(
        m => m.userId !== 'GLOBAL' && m.userId !== userId
      );
    }

    return results;
  }, [searchQuery, creatorFilter, monsters, fuse, userId]);

  return (
    <div className="bg-gray-600 rounded p-4 mb-4 border-2 border-purple-500">
      <h4 className="font-semibold mb-4">Select from Library</h4>

      {loading ? (
        <p className="text-gray-300">Loading...</p>
      ) : monsters.length === 0 ? (
        <p className="text-gray-300">
          No monster templates available.{' '}
          <a href="/monsters" className="text-blue-400 hover:text-blue-300">
            Create one
          </a>
        </p>
      ) : (
        <>
          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search monsters by name, type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Creator Filter */}
          <div className="mb-4 flex gap-2 flex-wrap">
            {(['all', 'mine', 'global', 'other'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setCreatorFilter(filter)}
                className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                  creatorFilter === filter
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {filter === 'mine'
                  ? 'My Monsters'
                  : filter === 'global'
                    ? 'Global Monsters'
                    : filter === 'other'
                      ? 'Other Monsters'
                      : 'All Monsters'}
              </button>
            ))}
          </div>

          {/* Monster List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMonsters.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                No monsters match your search and filter criteria.
              </div>
            ) : (
              filteredMonsters.map((template) => (
                <div
                  key={template.id}
                  className="flex justify-between items-center bg-gray-700 rounded p-2 hover:bg-gray-650 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{template.name}</div>
                    <div className="text-gray-400 text-xs flex gap-4 mt-1">
                      <span>{template.type}</span>
                      <span>CR {template.challengeRating}</span>
                      <span>
                        HP: {template.hp}/{template.maxHp}
                      </span>
                      <span>AC: {template.ac}</span>
                      {template.userId === 'GLOBAL' && (
                        <span className="text-green-400">(Global)</span>
                      )}
                      {template.userId === userId && (
                        <span className="text-blue-400">(Mine)</span>
                      )}
                      {template.userId !== 'GLOBAL' &&
                        template.userId !== userId && (
                          <span className="text-yellow-400">(Shared)</span>
                        )}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelect(template)}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm ml-2 flex-shrink-0 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="mt-4 w-full bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors"
      >
        Close
      </button>
    </div>
  );
}
