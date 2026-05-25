'use client';

import Link from 'next/link';
import { QuickCombatantModal } from '@/lib/components/QuickCombatantModal';
import { LairForm } from '@/lib/components/LairForm';
import { UseCombatReturn } from '@/lib/hooks/useCombat';
import { resolveCharactersForCombat } from '@/lib/utils/partySelection';
import { AuthUser } from '@/lib/hooks/useAuth';

export interface CombatSetupViewProps {
  combat: UseCombatReturn;
  user: AuthUser | null;
}

export function CombatSetupView({ combat, user }: CombatSetupViewProps) {
  const {
    encounters,
    parties,
    characters,
    setupCombatants,
    selectedEncounterId,
    selectedPartyId,
    error,
    showCombatantModal,
    showLairForm,
    lairFormName,
    lairFormSeedMonster,
    loadingTemplates,
    monsterTemplates,
    setSelectedEncounterId,
    selectParty,
    addCombatantFromLibrary,
    removeCombatantFromSetup,
    startCombat,
    startCombatWithSetupCombatants,
    setShowCombatantModal,
    setShowLairForm,
    setLairFormName,
    setLairFormSeedMonster,
    confirmAddLair,
    cancelLairForm
  } = combat;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Combat Tracker</h1>
          <Link href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
            Back to Home
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Start New Combat</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Option 1: Use existing characters */}
            <div className="border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">From Library</h3>
              <p className="text-gray-400 text-sm mb-4">
                Use your saved characters and encounters
              </p>
              
              <div className="mb-4">
                <label className="block text-sm mb-2">Select Encounter (Optional)</label>
                <select
                  value={selectedEncounterId}
                  onChange={(e) => setSelectedEncounterId(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="">No encounter</option>
                  {encounters.map(encounter => (
                    <option key={encounter.id} value={encounter.id}>
                      {encounter.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-2">Select Party (Optional)</label>
                <select
                  value={selectedPartyId ?? ''}
                  onChange={(e) => selectParty(e.target.value || null)}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="">No party (all characters)</option>
                  {parties.map(party => (
                    <option key={party.id} value={party.id}>
                      {party.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <p className="text-gray-400 text-xs">
                  Characters: {resolveCharactersForCombat(selectedPartyId, parties, characters, setupCombatants).length} |
                  Monsters: {selectedEncounterId ? encounters.find(e => e.id === selectedEncounterId)?.monsters.length || 0 : 0}
                </p>
              </div>

              <button
                onClick={startCombat}
                disabled={characters.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-semibold transition-colors"
              >
                Start Combat
              </button>
              {characters.length === 0 && (
                <p className="text-red-400 text-xs mt-2">Need at least one character</p>
              )}
            </div>

            {/* Option 2: Quick entry */}
            <div className="border border-blue-700 border-2 rounded-lg p-4 bg-blue-900 bg-opacity-20">
              <h3 className="text-lg font-semibold mb-3 text-blue-300">Quick Entry</h3>
              <p className="text-gray-400 text-sm mb-4">
                Add combatants on the fly during session
              </p>
              
              <p className="text-xs text-gray-400 mb-4">
                Enter name, dexterity, HP, and optional initiative. Perfect for DMs managing player characters elsewhere.
              </p>

              {setupCombatants.length > 0 && (
                <div className="mb-4 bg-gray-800 rounded p-3">
                  <p className="text-xs text-gray-400 mb-2">Quick Entry Combatants:</p>
                  <div className="space-y-2">
                    {setupCombatants.map(combatant => (
                      <div key={combatant.id} className="flex justify-between items-center bg-gray-700 rounded px-2 py-1 text-sm">
                        <span className="text-white">
                          {combatant.name} 
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${combatant.type === 'player' ? 'bg-blue-600' : 'bg-red-600'}`}>
                            {combatant.type}
                          </span>
                        </span>
                        <button
                          onClick={() => removeCombatantFromSetup(combatant.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                          aria-label={`Remove ${combatant.name}`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => setShowCombatantModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
                >
                  + Add Party Member
                </button>
                <button
                  onClick={() => setShowCombatantModal(true)}
                  className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
                >
                  + Add Enemy
                </button>
                <button
                  onClick={() => setShowLairForm(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
                >
                  + Add Lair
                </button>
                {setupCombatants.length > 0 && (
                  <button
                    onClick={startCombatWithSetupCombatants}
                    data-testid="start-combat-quick"
                    className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-semibold transition-colors mt-2"
                  >
                    Start Combat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {showCombatantModal && (
          <QuickCombatantModal
            onAddMonster={(monster) => addCombatantFromLibrary(monster, 'monster', 'monster')}
            onAddCharacter={(character) => addCombatantFromLibrary(character, 'player', 'character')}
            onClose={() => setShowCombatantModal(false)}
            monsterTemplates={monsterTemplates}
            characterTemplates={characters}
            loadingTemplates={loadingTemplates}
            userId={user?.userId}
          />
        )}

        {showLairForm && (
          <LairForm
            seedOptions={setupCombatants.filter(c => c.type !== 'lair' && (c.lairActions ?? []).length > 0).map(c => c.name)}
            lairName={lairFormName}
            seedMonster={lairFormSeedMonster}
            onNameChange={setLairFormName}
            onSeedChange={setLairFormSeedMonster}
            onConfirm={confirmAddLair}
            onCancel={cancelLairForm}
          />
        )}
      </div>
    </div>
  );
}
