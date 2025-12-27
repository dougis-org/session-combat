export type Party = { id: string; name: string; characterIds: string[]; description?: string };

export class PartyTestDataProvider {
  static sampleParties(): Party[] {
    return [
      { id: 'party-empty', name: 'Empty Party', characterIds: [], description: 'No characters' },
      { id: 'party-one', name: 'Solo Party', characterIds: ['char-1'], description: 'One character' },
      { id: 'party-three', name: 'Full Party', characterIds: ['char-2', 'char-3', 'char-4'], description: 'Three characters' },
    ];
  }

  static duplicateScenarios() {
    return [
      { preExistingSetupCombatants: ['char-1'], party: { id: 'party-one', name: 'Solo Party', characterIds: ['char-1'] } },
      { preExistingSetupCombatants: ['char-2', 'char-5'], party: { id: 'party-three', name: 'Full Party', characterIds: ['char-2', 'char-3'] } },
    ];
  }

  static edgeCases() {
    return [
      { party: { id: 'party-null-ids', name: 'Null IDs', characterIds: ["missing-char"] } },
      { party: null },
    ];
  }
}
