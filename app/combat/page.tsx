/**
 * Combat page - with End Combat button
 */
'use client';

import { useState } from 'react';
import { getLocalStore } from '@/lib/sync/LocalStore';

export default function CombatPage() {
  const [combatActive, setCombatActive] = useState(true);

  const handleEndCombat = async () => {
    try {
      const localStore = getLocalStore();
      // Use userId from auth context - placeholder here
      const userId = 'user-123';
      
      await localStore.deleteEntity('combatState', userId);
      console.debug('[Combat] Combat session ejected');
      setCombatActive(false);
    } catch (error) {
      console.error('[Combat] Failed to end combat:', error);
    }
  };

  return (
    <main>
      <h1>Combat</h1>
      {combatActive && (
        <button onClick={handleEndCombat}>End Combat</button>
      )}
      {!combatActive && <p>Combat ended</p>}
    </main>
  );
}
