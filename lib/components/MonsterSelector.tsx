'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { MonsterTemplate } from '@/lib/types';
import { GLOBAL_USER_ID } from '@/lib/constants';

type CreatorFilter = 'all' | 'mine' | 'global' | 'other';

interface MonsterSelectorProps {
  monsters: MonsterTemplate[];
  onSelect: (monster: MonsterTemplate) => void;
  onClose: () => void;
  loading?: boolean;
  userId?: string;
  hideCloseButton?: boolean;
}

export function MonsterSelector({
  monsters,
  onSelect,
  onClose,
  loading = false,
  userId,
  hideCloseButton = false,
}: MonsterSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [creatorFilter, setCreatorFilter] = useState<CreatorFilter>('all');

  const filterLabels: Record<CreatorFilter, string> = {
    all: 'All Monsters',
    mine: 'My Monsters',
    global: 'Global Monsters',
    other: 'Other Monsters',
  };

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
    const baseMonsters = searchQuery.trim()
      ? fuse.search(searchQuery).map((result) => result.item)
      : monsters;

    // If 'mine' filter is active but userId is not available, return empty
    if (creatorFilter === 'mine' && !userId) {
      return [];
    }

    if (creatorFilter === 'all') {
      return baseMonsters;
    }

    return baseMonsters.filter((m) => {
      switch (creatorFilter) {
        case 'mine':
          return m.userId === userId;
        case 'global':
          return m.userId === GLOBAL_USER_ID;
        case 'other':
          return m.userId !== GLOBAL_USER_ID && m.userId !== userId;
        default:
          return false;
      }
    });
  }, [searchQuery, creatorFilter, monsters, fuse, userId]);

  return (
    <div>
      {loading ? (
        <p className="text-gray-300">Loading...</p>
      ) : monsters.length === 0 ? (
        <p className="text-gray-300">
          No monster templates available.{' '}
          <Link href="/monsters" className="text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </p>
      ) : (
        <>
          {/* Search Input */}
          <div className="mb-4">
            <label htmlFor="monster-search" className="sr-only">
              Search monsters
            </label>
            <input
              id="monster-search"
              type="text"
              placeholder="Search monsters by name, type, description, or source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Search monsters by name, type, description, or source"
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
                aria-pressed={creatorFilter === filter}
              >
                {filterLabels[filter]}
              </button>
            ))}
          </div>

          {/* Monster List */}
          <div className="space-y-2">
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
                      {template.userId === GLOBAL_USER_ID ? (
                        <span className="text-green-400">(Global)</span>
                      ) : template.userId === userId ? (
                        <span className="text-blue-400">(Mine)</span>
                      ) : (
                        <span className="text-yellow-400">(Shared)</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelect(template)}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm ml-2 flex-shrink-0 transition-colors"
                    aria-label={`Add ${template.name} to encounter`}
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Close Button - only show if not hidden */}
      {!hideCloseButton && (
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors"
        >
          Close
        </button>
      )}
    </div>
  );
}
