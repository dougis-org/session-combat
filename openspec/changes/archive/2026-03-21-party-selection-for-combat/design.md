## Context

Combat setup (`app/combat/page.tsx`) has two panels: "From Library" (uses saved encounters + all characters) and "Quick Entry" (manual combatant building via modal). The "From Library" panel already has an optional encounter selector that scopes which monsters are included. Party selection mirrors this pattern — an optional selector that scopes which characters are included.

The existing remote branch `feature/30-select-party-for-combat` implemented party selection in December 2025 but was never merged; it has diverged significantly from main and has an unresolved TypeScript compilation issue. Its utility functions in `lib/utils/partySelection.ts` are clean and reusable, but its approach of adding party characters to `setupCombatants` (quick-entry list) doesn't align with the "From Library" placement now chosen.

**Current data flow in `startCombatWithSetupCombatants()`:**
```
setupCombatants (quick-entry)
  + ALL library characters
  + encounter monsters (if selectedEncounterId)
→ CombatState.combatants
```

**Proposed data flow:**
```
setupCombatants (quick-entry)
  + party characters (if selectedPartyId) OR all library characters (if no party)
    → deduplicated against setupCombatants
  + encounter monsters (if selectedEncounterId)
→ CombatState.combatants
```

## Goals / Non-Goals

**Goals:**
- Party selector in "From Library" panel, below encounter selector, same visual treatment
- Optional — no party selected = current behavior preserved exactly
- Party selected = only party's characters added; silent dedup against `setupCombatants`
- `selectedPartyId` cleared when `endCombat()` is called
- `lib/utils/partySelection.ts` utility module (port from feature branch)
- Unit tests for utilities; integration tests for party→combat flow

**Non-Goals:**
- Multi-party selection
- Party selector in the Quick Entry panel
- Auto-syncing party roster changes into an active combat
- Any API changes beyond adding `GET /api/parties` to the initial page load

## Decisions

### D1: Placement in "From Library", not Quick Entry

**Decision**: Party selector goes in the "From Library" panel.

**Rationale**: The "From Library" panel is for selecting from pre-defined library content (encounters, parties). The Quick Entry panel is for ad-hoc individual combatant addition. Party selection is semantically a library operation. The feature branch put it in Quick Entry, which felt like a workaround given the UI structure at the time — the current two-panel layout makes "From Library" the natural home.

**Alternative considered**: Quick Entry panel — rejected because it conflates library selection with ad-hoc entry.

### D2: Replace, not layer — when party selected, use party chars instead of all chars

**Decision**: `selectedPartyId` acts as a filter/switch: party selected → party's characters only; no party → all library characters.

**Rationale**: Confirmed by user. "All characters" is the fallback for users who don't care about party grouping; "party selected" is an explicit scope override. Layering (party chars + all chars) would defeat the purpose and always produce duplicates.

### D3: Silent deduplication against setupCombatants

**Decision**: When adding party characters (or all characters), skip any whose ID already appears in `setupCombatants` (after accounting for the `character-${id}` ID prefix used there). No warning shown; silently skipped.

**Rationale**: Confirmed by user. A warning on every mismatch would be noisy — the user explicitly added those characters via Quick Entry and doesn't need reminding. Failing hard or showing a modal would interrupt the workflow.

**ID matching note**: `setupCombatants` entries added via `addCombatantFromLibrary()` use IDs like `character-${char.id}` or `monster-${...}`. The dedup check must detect if `char.id` is already represented in any `setupCombatants` entry's ID string.

### D4: Port partySelection.ts from feature branch

**Decision**: Reuse `expandPartyToCharacters()` and `findDuplicatePartyCharacters()` from `feature/30-select-party-for-combat`.

**Rationale**: The utilities are well-scoped and correct. Avoids rewriting identical logic. Only change: `findDuplicatePartyCharacters` already handles the substring-match ID check correctly.

### D5: Parties fetched at page load alongside other resources

**Decision**: Add `fetch('/api/parties')` to the existing `Promise.all([...])` in the `useEffect` data load.

**Rationale**: Consistent with how encounters, characters, and monsters are loaded. No lazy loading or separate effect needed — parties are small and always needed if the user wants to select one.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| ID mismatch in dedup check (`character-${id}` vs `id`) | `findDuplicatePartyCharacters` uses `Array.from(setupIds).some(id => id.includes(pc.id))` — substring match handles the prefix. Cover in unit tests. |
| `GET /api/parties` fails silently | Already in pattern: other fetches use same error check; extend the `if (!...ok)` guard to include `partiesRes`. |
| Feature branch TypeScript issue | The TS issue was in the feature branch's broader changes (types.d.ts removal). We're only porting `partySelection.ts` and targeted changes — the root cause doesn't apply. |
| `parties` typed as `any[]` in feature branch | Tighten to `Party[]` using the existing `Party` type from `lib/types`. |

## Open Questions

None — all decisions confirmed during exploration.
