# Implementation Plan: Issue #30

**Update combat to allow selecting which party (or parties) should be included**

---

## 1) Summary

- **Ticket**: GitHub Issue #30
- **One-liner**: Enable combat initialization to accept user-selected parties as an alternative or supplement to manually selecting individual characters, matching the UX pattern already established for encounter selection.
- **Related milestone(s)**: None specified
- **Out of scope**:
  - Multi-party simultaneous combat (only one selected party per combat session)
  - Auto-syncing party character changes into active combat
  - Party role-based visibility or restrictions
  - Encounter-to-party auto-linking

---

## 2) Assumptions & Open Questions

**Assumptions:**
1. Users can select zero or one party during combat setup (not multiple)
2. Party selection is optional; manual character selection should still be available
3. Party characters are added to combat alongside manually selected combatants and encounter monsters
4. No changes to Party data model are required
5. Integration tests will use MongoDB Testcontainers (per existing pattern)
6. Feature does not require a feature flag (low complexity, low risk)

**Open questions (blocking → need answers):**
- None blocking; proceeding with assumptions.

---

## 3) Acceptance Criteria (normalized)

1. **Combat setup displays available parties** – Users can see a dropdown/selector of all parties they own on the combat initialization UI.
2. **Party selection is optional** – Users can start combat without selecting a party; selection should be idempotent (selecting and deselecting does not break state).
3. **Selected party characters are added to combat** – When a party is selected, all characters in that party are automatically added to the setup combatants list (matching behavior of manually added characters).
4. **No duplicate characters** – If a character is already in the party and manually added, it should not be duplicated; UI should warn or prevent the duplicate.
5. **Party selection persists until encounter setup is complete** – Selected party remains visible and can be deselected before "Start Combat" is clicked.
6. **Existing combat flow remains intact** – Party selection is additive; all existing combat features (encounter selection, manual combatant entry, initiative rolling, turn tracking) are unaffected.
7. **Integration tests validate party-to-combat flow** – New tests confirm party selection and character addition.

---

## 4) Approach & Design Brief

### Current State
- Combat page (`app/combat/page.tsx`) loads encounters and characters independently
- Users manually select an encounter for monsters
- All characters are auto-added to combat setup; no selection mechanism exists
- Combat initialization combines setup combatants + all characters + encounter monsters (see `startCombatWithSetupCombatants()`)
- Party data structure exists and is managed independently on the Parties page (`app/parties/page.tsx`)
- No party selection UI currently exists on the combat page

### Proposed Changes

**High-level architecture & data flow:**
1. **Combat page loads parties** – Fetch parties API alongside encounters, characters, and monsters
2. **Party selector UI** – Add dropdown/select control to combat setup panel (before "Start Combat" button)
3. **Party selection handler** – On selection, expand party's character list and add to setup combatants
4. **Deduplication logic** – Check if selected characters are already in setup; warn and skip if duplicate
5. **Combat initialization** – No change to `startCombatWithSetupCombatants()`; party-selected characters are already in setup list

**Data model / schema:**
- No schema changes required; Party type already exists with `characterIds: string[]`
- CombatState does not track which party was selected (party is only used during setup)

**APIs & contracts:**
- **Existing** `GET /api/parties` – Already fetches all user parties; no changes needed
- **No new endpoints required** – Party selection is a client-side UI feature

**Example flow:**
1. User navigates to Combat page
2. Party dropdown populated from `GET /api/parties` response
3. User selects "Tavern Gang" party (id: `party-123`)
4. Client fetches character data for `party.characterIds = ['char-1', 'char-2', 'char-3']`
5. Characters added to `setupCombatants` state
6. User can still manually add more combatants or select an encounter
7. Click "Start Combat" → `startCombatWithSetupCombatants()` combines all and initializes session

**Feature flags:**
- None required (low-risk UI addition)

**Config:**
- No new environment variables required

**External deps:**
- No new dependencies required
- Reuse existing fetch patterns and state management

**Backward compatibility strategy:**
- Party selection is optional; all existing workflows (manual combatant selection, encounter selection) remain available
- No breaking changes to API or data structures

**Observability (metrics/logs/traces/alerts):**
- Add debug console logs when party is selected (for QA verification)
- No production metrics or alerts required for this feature
- Integration tests will verify correct data flow

**Security & privacy:**
- Party selection respects user authentication (parties fetched for authenticated user only via requireAuth middleware)
- No sensitive data exposure; parties contain only character IDs
- No authorization changes needed (users can only select their own parties)

**Alternatives considered:**
1. **Pre-create combatants at party creation time** – Rejected; parties are reusable templates, not pre-rolled combatants
2. **Multi-party selection** – Rejected (out of scope per ticket); keep to single optional party
3. **Auto-sync party changes during combat** – Rejected (out of scope); changes to party post-setup do not affect active combat

---

## 5) Step-by-Step Implementation Plan (TDD)

### Phase 1: Test Additions (RED state)

**1.1 – Unit Test: Party selection state management**
- **File (new)**: `tests/integration/partySelection.test.ts`
- **Test data (new)**: `tests/integration/helpers/partyTestData.ts` (test fixture with 2–3 sample parties)
- **Objective**: Verify that selecting a party correctly expands its characters into setup combatants
- **Parameterized inputs** (CSV/provider):
  - Party with 0 characters (edge case)
  - Party with 1 character
  - Party with 3 characters
  - Deselecting a party clears added characters
  - Selecting a new party replaces previous selection
- **Assertions**:
  - Selected party's characters appear in `setupCombatants`
  - Character count matches `party.characterIds.length`
  - Deselection removes party characters from setup

**1.2 – Integration Test: Party selection in combat initialization**
- **File (new)**: `tests/integration/combatWithParty.test.ts`
- **Objective**: E2E test that party selection flows through combat setup and initialization
- **Test cases**:
  - User selects party → characters added to setup
  - User selects encounter + party → monsters + party characters both present in combat
  - User selects party + manually adds duplicate character → duplicate warning or prevention
  - Party with no characters selected → no error, combat proceeds
- **Data provider**: Reuse `partyTestData.ts` + existing monster/character fixtures
- **Assertions**:
  - Combat state includes party-selected characters
  - Character order preserved (no unexpected re-sorting)
  - Initiative rolls include all combatants (party + manual + encounter)

---

### Phase 2: Implementation (GREEN state)

**2.1 – Update combat/page.tsx: Load parties**
- **File**: `app/combat/page.tsx`
- **Change**: Add `parties` state and load parties in initial `useEffect`
- **Code snippet**:
  ```typescript
  const [parties, setParties] = useState<Party[]>([]);
  // In loadData useEffect:
  const partiesRes = await fetch('/api/parties');
  const partiesData = await partiesRes.json();
  setParties(partiesData || []);
  ```

**2.2 – Add party selection state and handler**
- **File**: `app/combat/page.tsx`
- **Changes**:
  - Add `selectedPartyId: string | null` state
  - Add handler `selectParty(partyId: string | null)`
  - On party selection, call internal function to expand party characters into `setupCombatants`
- **Handler logic** (pseudo):
  ```typescript
  const selectParty = (partyId: string | null) => {
    if (!partyId) {
      setSelectedPartyId(null);
      // Remove party-added characters from setupCombatants
      setSetupCombatants(prev => prev.filter(c => !c.id.startsWith('party-')));
      return;
    }
    
    const party = parties.find(p => p.id === partyId);
    if (!party) return;
    
    setSelectedPartyId(partyId);
    
    // Add party's characters to setup
    const partyCharacters = characters.filter(c => party.characterIds.includes(c.id));
    const newCombatants = partyCharacters.map(char => ({
      id: `party-${partyId}-${char.id}`,
      name: char.name,
      type: 'player',
      initiative: 0,
      abilityScores: char.abilityScores,
      hp: char.hp,
      maxHp: char.maxHp,
      ac: char.ac,
      conditions: [],
      traits: char.traits,
      actions: char.actions,
      bonusActions: char.bonusActions,
      reactions: char.reactions,
    }));
    
    // Check for duplicates
    const existingIds = new Set(setupCombatants.map(c => c.id.split('-').pop()));
    const duplicates = newCombatants.filter(nc => existingIds.has(nc.id.split('-').pop()));
    if (duplicates.length > 0) {
      setError(`${duplicates.length} characters from party already in combat`);
      return;
    }
    
    setSetupCombatants(prev => [...prev, ...newCombatants]);
  };
  ```

**2.3 – Add party selector UI to combat setup panel**
- **File**: `app/combat/page.tsx`
- **Location**: In the setup combatants section, before "Start Combat" button
- **UI element**: Dropdown select with options:
  - "-- No Party --" (default)
  - Each party name from `parties` array
- **On change**: Trigger `selectParty(selectedValue)`

**2.4 – Handle deduplication edge case**
- **File**: `app/combat/page.tsx`
- **Change**: Before expanding party, check if any party characters are already in setup
- **Behavior**: If duplicates found, set error toast and prevent addition
- **Error message**: "Character [name] from this party is already in combat setup. Remove it first to add the full party."

---

### Phase 3: Refactor (no behavior change)

**3.1 – Extract party selection logic to utility**
- **File (new)**: `lib/utils/partySelection.ts`
- **Export functions**:
  - `expandPartyToCharacters(party: Party, characters: Character[]): CombatantState[]`
  - `findDuplicatePartyCharacters(partyCharacters: Character[], setupCombatants: CombatantState[]): Character[]`
- **Rationale**: Reusable for tests and future party-related features

**3.2 – Review for duplication within combat page**
- Existing code already has duplicate detection for manually added monsters; reuse that pattern for party characters

---

### Phase 4: Pre-PR Cleanup & Validation

**4.1 – Run linting and formatting**
```bash
npm run lint
npm run format
```

**4.2 – Static analysis**
- Check for unused imports, dead code, commented blocks
- Ensure TypeScript strict mode compliance

**4.3 – Build validation**
```bash
npm run build
```

**4.4 – Manual QA checklist**
- [ ] Parties dropdown appears on combat page
- [ ] Selecting a party adds its characters to setup
- [ ] Deselecting a party removes its characters
- [ ] Party + encounter + manual combatants all present after "Start Combat"
- [ ] Initiative rolls include all combatants (party + manual + encounter)
- [ ] Duplicate character warning prevents adding duplicate

---

## 6) Effort, Risks, Mitigations

### Effort Estimate: **Medium (M)**

**Rationale:**
- UI addition (dropdown + handler): ~2–3 hours
- State management and deduplication logic: ~2 hours
- Integration tests: ~2 hours
- Refactor and cleanup: ~1 hour
- **Total**: ~7–8 hours

### Risks (ranked)

| Rank | Risk | Impact | Likelihood | Mitigation | Fallback |
|------|------|--------|------------|-----------|----------|
| 1 | **Character deduplication edge case** | Duplicate combatants in combat, breaking initiative/turns | Medium | Add duplicate detection before expanding party; warn user; test with parameterized duplicates | Manual deduplication UI post-selection |
| 2 | **Party with deleted characters** | Fetch fails, party becomes unusable | Low | Add null-check when expanding party; skip missing characters with warning | Skip missing characters, proceed with rest |
| 3 | **Performance: large parties** | UI lag when expanding 20+ characters | Low | Unlikely (typical party size 4–6); pagination not needed now | Defer to future optimization; not blocking |
| 4 | **Party selection state pollution** | Selected party remains after ending combat | Low | Clear `selectedPartyId` in `endCombat()` handler | Explicit button to clear party |

---

## 7) File-Level Change List

| File | Change |
|------|--------|
| `app/combat/page.tsx` | Add party state; load parties; add selector UI; implement party selection handler and deduplication logic |
| `lib/utils/partySelection.ts` | **(NEW)** Export `expandPartyToCharacters()` and `findDuplicatePartyCharacters()` utilities |
| `tests/integration/partySelection.test.ts` | **(NEW)** Unit tests for party selection state management (parameterized with `partyTestData.ts`) |
| `tests/integration/combatWithParty.test.ts` | **(NEW)** Integration tests for party selection in combat initialization |
| `tests/integration/helpers/partyTestData.ts` | **(NEW)** Test fixture with sample parties (0, 1, 3 characters each) |

---

## 8) Test Plan

### Parameterized Test Strategy

**Test data source:** `tests/integration/helpers/partyTestData.ts`
- Provider class with static methods returning arrays of test parties
- Each party fixture includes: `id`, `name`, `characterIds`, `description`
- Variations: empty party, single-char party, multi-char party

**Test Categories:**

| Category | Approach | Data Source | Rationale |
|----------|----------|-------------|-----------|
| **Party selection state** | Parameterized (provider method) | `PartyTestDataProvider.sampleParties()` | Multiple party sizes to catch edge cases |
| **Character expansion** | Parameterized (CSV-like provider) | `PartyTestDataProvider.characterCountVariations()` | 0, 1, 3, 5 characters per party |
| **Deduplication** | Parameterized (provider) | `PartyTestDataProvider.duplicateScenarios()` | Shared characters, overlapping combatants |
| **Combat initialization** | Integration (Testcontainers) | Real MongoDB + parties, characters, encounters | E2E flow validation |
| **Regression** | Smoke test (simple) | Manual combatant entry still works | Verify no breakage to existing flow |
| **Edge cases** | Parameterized (provider) | `PartyTestDataProvider.edgeCases()` | Empty party, missing characters, null party ID |

### Test Coverage Breakdown

1. **Happy paths** (parameterized):
   - Select party → characters added
   - Deselect party → characters removed
   - Party + encounter + manual → all combatants present

2. **Error cases** (parameterized):
   - Party with deleted character (missing from characters list)
   - Duplicate character in party and setup
   - Select → deselect → select different party (state consistency)

3. **Contract/Integration** (Testcontainers):
   - Party fetch via `/api/parties` returns correct schema
   - Combat state persists with party-selected characters

4. **Regression** (smoke):
   - Combat without party selection works (backward compatibility)
   - Encounter selection unaffected
   - Manual combatant entry unaffected

---

## 9) Rollout & Monitoring Plan

### Feature Flags
- **Not required** – Low-risk UI addition; deploy directly

### Deployment Steps
1. Merge PR to `main`
2. Deploy to staging
3. Manual QA (see Phase 4 checklist)
4. Deploy to production
5. Monitor user feedback on party selection feature

### Dashboards & Key Metrics
- No production metrics needed (not a critical feature)
- Monitor error logs for any party fetch failures

### Alerts
- Alert if `/api/parties` response time > 1s
- Alert if error rate on combat page > 2%

### Success Metrics / KPIs
- Users can successfully select a party during combat setup
- No regression in combat initialization success rate

### Rollback Procedure
```bash
# If issues arise:
git revert <commit-hash>
npm run build
npm start
```

---

## 10) Handoff Package

- **Jira link**: [GitHub Issue #30](https://github.com/dougis-org/session-combat/issues/30)
- **Branch**: `feature/30-select-party-for-combat`
- **Plan file**: `docs/plan/tickets/30-plan.md`
- **Key commands**:
  - `npm run dev` – Start development server
  - `npm run test:integration` – Run integration tests
  - `npm run lint` – Check code quality
  - `npm run build` – Build for production
- **Known gotchas / watchpoints**:
  - Party state must be cleared when combat ends (see Phase 2.2)
  - Character ID matching between parties and characters list (ensure IDs match exactly)

---

## 11) Traceability Map

| AC # | Requirement | Milestone | Task(s) | Flag(s) | Test(s) |
|------|-------------|-----------|---------|---------|---------|
| 1 | **Combat setup displays available parties** | None | UI dropdown; load parties API | None | `combatWithParty.test.ts` |
| 2 | **Party selection is optional** | None | Null state handling; deselect handler | None | `partySelection.test.ts` |
| 3 | **Selected party characters added to combat** | None | `selectParty()` handler; character expansion | None | `partySelection.test.ts`, `combatWithParty.test.ts` |
| 4 | **No duplicate characters** | None | Deduplication logic; duplicate detection utility | None | `partySelection.test.ts` (parameterized duplicates) |
| 5 | **Party selection persists until setup complete** | None | State preservation; clear on end-combat | None | `combatWithParty.test.ts` |
| 6 | **Existing combat flow remains intact** | None | Backward compatibility; no changes to `startCombatWithSetupCombatants()` | None | Regression smoke test |
| 7 | **Integration tests validate party-to-combat flow** | None | Integration test suite | None | `combatWithParty.test.ts` |

---

## Notes

- **Reusable patterns discovered**: Existing duplicate detection for manually added combatants (see `addCombatantToActiveSession()` in `app/combat/page.tsx`, lines ~220–270); reuse for party characters.
- **No breaking changes**: All existing APIs and workflows remain unchanged.
- **Future enhancements**: Multi-party selection, party-level permissions, auto-sync party changes into active combat (out of scope for this ticket).

---

**Plan finalized**: 2025-12-22  
**Branch**: `feature/30-select-party-for-combat`  
**Status**: Ready for implementation
