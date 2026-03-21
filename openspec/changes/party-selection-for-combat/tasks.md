## 1. Execution

- [x] 1.1 Check out `main` and pull latest remote changes
- [x] 1.2 Create feature branch `feature/30-party-selection-for-combat`

## 2. Utility Module

- [x] 2.1 Create `lib/utils/partySelection.ts` — port `expandPartyToCharacters()` and `findDuplicatePartyCharacters()` from `feature/30-select-party-for-combat`; tighten types to use `Party` and `Character` from `lib/types` instead of `any`
- [x] 2.2 Write unit tests in `tests/unit/lib/partySelection.test.ts` covering: happy path expansion, empty party, character not found, duplicate detection (with `character-${id}` prefix), no-overlap case, suffixed IDs, and false-positive prevention

## 3. Combat Page — State & Data

- [x] 3.1 Add `parties` state (`Party[]`) and `selectedPartyId` state (`string | null`) to `CombatContent` in `app/combat/page.tsx`
- [x] 3.2 Add `fetch('/api/parties')` to the existing `Promise.all([...])` initial data load; extend the `if (!...ok)` error guard to include `partiesRes`
- [x] 3.3 Set `parties` state from the fetch response

## 4. Combat Page — Logic

- [x] 4.1 Implement `selectParty(partyId: string | null)` handler: update `selectedPartyId` state; no other side effects (party chars are resolved at start-combat time, not at select time)
- [x] 4.2 Modify `startCombatWithSetupCombatants()`: when `selectedPartyId` is set, use `expandPartyToCharacters()` to get party characters and `findDuplicatePartyCharacters()` to skip those already in `setupCombatants`; when no party, use existing all-characters loop unchanged
- [x] 4.3 Add `setSelectedPartyId(null)` to the `endCombat()` reset path

## 5. Combat Page — UI

- [x] 5.1 Add party selector dropdown to the "From Library" panel in `app/combat/page.tsx`, below the encounter selector; first option is "No party (all characters)" with value `""`; remaining options map `parties` array to `<option key={p.id} value={p.id}>{p.name}</option>`
- [x] 5.2 Wire `onChange` to `selectParty(e.target.value || null)`
- [x] 5.3 Update the character count display (currently `Characters: {characters.length}`) to show the effective count: party characters when selected, all characters when not

## 6. Validation

- [x] 6.1 Run `npm run lint` — confirm zero new errors
- [x] 6.2 Run `npm run build` — confirm TypeScript compilation succeeds
- [x] 6.3 Run `npm run test:unit -- --testPathPattern=tests/unit/lib/partySelection.test.ts` — all unit tests pass
- [x] 6.4 Run full test suite `npm test` — no regressions
- [ ] 6.5 Manual smoke test: select party → start combat → verify only party characters present
- [ ] 6.6 Manual smoke test: no party selected → start combat → verify all characters present
- [ ] 6.7 Manual smoke test: character manually added + same character in party → verify no duplicate in combat


## 7. PR and Merge

- [x] 7.1 Push branch and open PR against `main`; reference issue #30 in description
- [ ] 7.2 Confirm CI passes (lint, build, tests)
- [ ] 7.3 Resolve any review comments before merge
- [ ] 7.4 Enable auto-merge or merge once approved

## 8. Post-Merge

- [ ] 8.1 Run `/opsx:archive party-selection-for-combat` to archive the change
- [ ] 8.2 Sync approved spec to `openspec/specs/party-selection-for-combat/spec.md`
- [ ] 8.3 Delete local feature branch; confirm remote branch cleaned up
- [ ] 8.4 Close GitHub issue #30
