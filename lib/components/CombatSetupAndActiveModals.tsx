'use client';

import { QuickCombatantModal } from '@/lib/components/QuickCombatantModal';
import { LairForm } from '@/lib/components/LairForm';
import { UseCombatReturn } from '@/lib/hooks/useCombat';
import { AuthUser } from '@/lib/hooks/useAuth';

export interface CombatSetupAndActiveModalsProps {
  combat: UseCombatReturn;
  user: AuthUser | null;
  seedOptions: string[];
}

export function CombatSetupAndActiveModals({
  combat,
  user,
  seedOptions,
}: CombatSetupAndActiveModalsProps) {
  const {
    showCombatantModal,
    showLairForm,
    lairFormName,
    lairFormSeedMonster,
    loadingTemplates,
    monsterTemplates,
    characters,
    setShowCombatantModal,
    addCombatantFromLibrary,
    setLairFormName,
    setLairFormSeedMonster,
    confirmAddLair,
    cancelLairForm,
  } = combat;

  return (
    <>
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
          seedOptions={seedOptions}
          lairName={lairFormName}
          seedMonster={lairFormSeedMonster}
          onNameChange={setLairFormName}
          onSeedChange={setLairFormSeedMonster}
          onConfirm={confirmAddLair}
          onCancel={cancelLairForm}
        />
      )}
    </>
  );
}
