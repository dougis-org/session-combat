'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { Monster, MonsterTemplate, Character } from '@/lib/types';
import { GLOBAL_USER_ID } from '@/lib/constants';

interface QuickCombatantModalProps {
  onAddMonster: (monster: Monster) => void;
  onAddCharacter?: (character: Character) => void;
  onClose: () => void;
  monsterTemplates: MonsterTemplate[];
  characterTemplates?: Character[];
  loadingTemplates?: boolean;
  userId?: string;
}

type TabType = 'monsters' | 'characters' | 'custom';

export function QuickCombatantModal({
  onAddMonster,
  onAddCharacter,
  onClose,
  monsterTemplates,
  characterTemplates = [],
  loadingTemplates = false,
  userId,
}: QuickCombatantModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('monsters');
  const [searchQuery, setSearchQuery] = useState('');
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'mine' | 'global' | 'other'>('all');

  // Form state for custom entry
  const [customFormData, setCustomFormData] = useState({
    name: '',
    hp: 10,
    maxHp: 10,
    ac: 10,
    dexterity: 10,
  });

  const [error, setError] = useState<string | null>(null);

  // Reset search and filters when tab changes
  useEffect(() => {
    setSearchQuery('');
    setCreatorFilter('all');
  }, [activeTab]);

  // Fuse.js fuzzy search setup for monsters
  const monsterFuse = useMemo(
    () =>
      new Fuse(monsterTemplates, {
        keys: ['name', 'type', 'description', 'source'],
        threshold: 0.3,
        includeScore: true,
      }),
    [monsterTemplates]
  );

  // Fuse.js fuzzy search setup for characters
  const characterFuse = useMemo(
    () =>
      new Fuse(characterTemplates, {
        keys: ['name', 'classes.class'],
        threshold: 0.3,
        includeScore: true,
      }),
    [characterTemplates]
  );

  // Perform search and filter for monsters
  const filteredMonsters = useMemo(() => {
    const baseMonsters = searchQuery.trim()
      ? monsterFuse.search(searchQuery).map((result) => result.item)
      : monsterTemplates;

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
  }, [searchQuery, creatorFilter, monsterTemplates, monsterFuse, userId]);

  // Perform search and filter for characters
  const filteredCharacters = useMemo(() => {
    const baseCharacters = searchQuery.trim()
      ? characterFuse.search(searchQuery).map((result) => result.item)
      : characterTemplates;

    if (creatorFilter === 'all') {
      return baseCharacters;
    }

    return baseCharacters.filter((c) => {
      switch (creatorFilter) {
        case 'mine':
          return c.userId === userId;
        case 'global':
          return c.userId === GLOBAL_USER_ID;
        case 'other':
          return c.userId !== GLOBAL_USER_ID && c.userId !== userId;
        default:
          return false;
      }
    });
  }, [searchQuery, creatorFilter, characterTemplates, characterFuse, userId]);

  const handleAddFromLibrary = (template: MonsterTemplate) => {
    const newMonster: Monster = {
      ...template,
      id: crypto.randomUUID(),
      templateId: template.id,
    };
    onAddMonster(newMonster);
    // Keep modal open to allow adding multiple monsters from library
  };

  const handleAddCharacterFromLibrary = (character: Character) => {
    if (onAddCharacter) {
      onAddCharacter(character);
      // Keep modal open to allow adding multiple characters from library
    }
  };

  const handleAddCustomMonster = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!customFormData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (customFormData.dexterity < 1 || customFormData.dexterity > 30) {
      setError('Dexterity must be between 1 and 30 (30 is allowed for powerful monsters or exceptional creatures)');
      return;
    }

    if (customFormData.ac < 1) {
      setError('AC must be at least 1');
      return;
    }

    if (customFormData.maxHp < 1) {
      setError('Max HP must be at least 1');
      return;
    }

    if (customFormData.hp < 0 || customFormData.hp > customFormData.maxHp) {
      setError('Current HP must be between 0 and Max HP');
      return;
    }

    if (customFormData.ac < 1) {
      setError('AC must be at least 1');
      return;
    }
    const newMonster: Monster = {
      id: crypto.randomUUID(),
      name: customFormData.name.trim(),
      hp: customFormData.hp,
      maxHp: customFormData.maxHp,
      ac: customFormData.ac,
      abilityScores: {
        strength: 10,
        dexterity: customFormData.dexterity,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      size: 'medium',
      type: 'humanoid',
      speed: '30 ft.',
      challengeRating: 0,
    };

    onAddMonster(newMonster);
    onClose();
  };

  const handleCustomFormChange = (
    field: keyof typeof customFormData,
    value: string | number
  ) => {
    setCustomFormData((prev) => {
      if (field === 'name') {
        return { ...prev, name: String(value) };
      }

      const stringValue = String(value);
      let numValue: number;

      if (stringValue.trim() === '') {
        numValue = 0;
      } else {
        const parsed = parseInt(stringValue, 10);
        numValue = Number.isNaN(parsed) ? 0 : parsed;
      }

      return {
        ...prev,
        [field]: numValue,
      };
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalHeading"
    >
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 id="modalHeading" className="text-2xl font-bold text-white">
            Add Combatant
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6 pt-4" role="tablist">
          <button
            onClick={() => {
              setActiveTab('monsters');
              setError(null);
            }}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'monsters'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
            aria-selected={activeTab === 'monsters'}
            aria-controls="tab-monsters-panel"
            role="tab"
          >
            Monsters
          </button>
          <button
            onClick={() => {
              setActiveTab('characters');
              setError(null);
            }}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'characters'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
            aria-selected={activeTab === 'characters'}
            aria-controls="tab-characters-panel"
            role="tab"
          >
            Party Members
          </button>
          <button
            onClick={() => {
              setActiveTab('custom');
              setError(null);
            }}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'custom'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
            aria-selected={activeTab === 'custom'}
            aria-controls="tab-custom-panel"
            role="tab"
          >
            Create New
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {error && (
            <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Library Tab - Monsters */}
          <div
            id="tab-monsters-panel"
            role="tabpanel"
            aria-labelledby="tab-monsters"
            hidden={activeTab !== 'monsters'}
            className={activeTab === 'monsters' ? 'block' : 'hidden'}
          >
            <div className="space-y-4">
              {loadingTemplates ? (
                <p className="text-gray-300">Loading templates...</p>
              ) : monsterTemplates.length === 0 ? (
                <p className="text-gray-300">
                  No monster templates available.{' '}
                  <Link href="/monsters" className="text-blue-400 hover:text-blue-300">
                    Create one
                  </Link>
                </p>
              ) : (
                <>
                  {/* Search Input */}
                  <div>
                    <label htmlFor="monster-search" className="sr-only">
                      Search monsters
                    </label>
                    <input
                      id="monster-search"
                      type="text"
                      placeholder="Search by name, type, description, or source..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      aria-label="Search monsters"
                    />
                  </div>

                  {/* Creator Filter */}
                  <div className="flex gap-2 flex-wrap">
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
                        {filter === 'all' ? 'All' : filter === 'mine' ? 'My' : filter === 'global' ? 'Global' : 'Other'}
                      </button>
                    ))}
                  </div>

                  {/* Monster List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {filteredMonsters.length === 0 ? (
                      <div className="text-gray-400 text-center py-4">
                        No monsters match your search and filter criteria.
                      </div>
                    ) : (
                      filteredMonsters.map((template) => (
                        <div
                          key={template.id}
                          className="flex justify-between items-center bg-gray-700 rounded p-3 hover:bg-gray-650 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{template.name}</div>
                            <div className="text-gray-400 text-xs flex gap-3 mt-1 flex-wrap">
                              <span>{template.type}</span>
                              <span>CR {template.challengeRating}</span>
                              <span>HP: {template.hp}/{template.maxHp}</span>
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
                            onClick={() => handleAddFromLibrary(template)}
                            className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm ml-3 flex-shrink-0 transition-colors"
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
            </div>
          </div>

          {/* Characters Tab */}
          <div
            id="tab-characters-panel"
            role="tabpanel"
            aria-labelledby="tab-characters"
            hidden={activeTab !== 'characters'}
            className={activeTab === 'characters' ? 'block' : 'hidden'}
          >
            <div className="space-y-4">
              {loadingTemplates ? (
                <p className="text-gray-300">Loading characters...</p>
              ) : characterTemplates.length === 0 ? (
                <p className="text-gray-300">
                  No party members available.{' '}
                  <Link href="/characters" className="text-blue-400 hover:text-blue-300">
                    Create one
                  </Link>
                </p>
              ) : (
                <>
                  {/* Search Input */}
                  <div>
                    <label htmlFor="character-search" className="sr-only">
                      Search characters
                    </label>
                    <input
                      id="character-search"
                      type="text"
                      placeholder="Search by name or class..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      aria-label="Search characters"
                    />
                  </div>

                  {/* Creator Filter */}
                  <div className="flex gap-2 flex-wrap">
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
                        {filter === 'all' ? 'All' : filter === 'mine' ? 'My' : filter === 'global' ? 'Global' : 'Other'}
                      </button>
                    ))}
                  </div>

                  {/* Character List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {filteredCharacters.length === 0 ? (
                      <div className="text-gray-400 text-center py-4">
                        No characters match your search and filter criteria.
                      </div>
                    ) : (
                      filteredCharacters.map((character) => (
                        <div
                          key={character.id}
                          className="flex justify-between items-center bg-gray-700 rounded p-3 hover:bg-gray-650 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{character.name}</div>
                            <div className="text-gray-400 text-xs flex gap-3 mt-1 flex-wrap">
                              <span>HP: {character.hp}/{character.maxHp}</span>
                              <span>AC: {character.ac}</span>
                              {character.classes && character.classes.length > 0 && (
                                <span>
                                  Class: {character.classes.map(c => c.class).join('/')}
                                </span>
                              )}
                              {character.userId === GLOBAL_USER_ID ? (
                                <span className="text-green-400">(Global)</span>
                              ) : character.userId === userId ? (
                                <span className="text-blue-400">(Mine)</span>
                              ) : (
                                <span className="text-yellow-400">(Shared)</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddCharacterFromLibrary(character)}
                            className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm ml-3 flex-shrink-0 transition-colors"
                            aria-label={`Add ${character.name} to combat`}
                          >
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Custom Tab */}
          <div
            id="tab-custom-panel"
            role="tabpanel"
            aria-labelledby="tab-custom"
            hidden={activeTab !== 'custom'}
            className={activeTab === 'custom' ? 'block' : 'hidden'}
          >
            <form onSubmit={handleAddCustomMonster} className="space-y-4">
              <div>
                <label htmlFor="custom-name" className="block text-sm font-semibold mb-2 text-gray-200">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="custom-name"
                  type="text"
                  value={customFormData.name}
                  onChange={(e) => handleCustomFormChange('name', e.target.value)}
                  placeholder="Monster or character name"
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="custom-dex" className="block text-sm font-semibold mb-2 text-gray-200">
                  Dexterity <span className="text-red-500">*</span>
                </label>
                <input
                  id="custom-dex"
                  type="number"
                  min="1"
                  max="30"
                  value={customFormData.dexterity}
                  onChange={(e) => handleCustomFormChange('dexterity', e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Initiative modifier:{' '}
                  {Math.floor((customFormData.dexterity - 10) / 2) >= 0 ? '+' : ''}
                  {Math.floor((customFormData.dexterity - 10) / 2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="custom-ac" className="block text-sm font-semibold mb-2 text-gray-200">
                    AC <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="custom-ac"
                    type="number"
                    min="1"
                    value={customFormData.ac}
                    onChange={(e) => handleCustomFormChange('ac', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="custom-maxhp" className="block text-sm font-semibold mb-2 text-gray-200">
                    Max HP <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="custom-maxhp"
                    type="number"
                    min="1"
                    value={customFormData.maxHp}
                    onChange={(e) => handleCustomFormChange('maxHp', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="custom-hp" className="block text-sm font-semibold mb-2 text-gray-200">
                  Current HP <span className="text-red-500">*</span>
                </label>
                <input
                  id="custom-hp"
                  type="number"
                  min="0"
                  value={customFormData.hp}
                  onChange={(e) => {
                    const newHp = parseInt(e.target.value) || 0;
                    handleCustomFormChange('hp', newHp);
                  }}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition-colors"
                >
                  Add Combatant
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
