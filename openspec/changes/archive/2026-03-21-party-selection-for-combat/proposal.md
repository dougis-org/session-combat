## Why

Combat setup currently auto-adds every library character to every session, giving players no way to say "we're playing with the Heroes party today, not all 30 characters." Issue #30 asks for party selection to mirror how encounter selection already works — optional, explicit, and scoped.

## What Changes

- **New**: Party selector dropdown added to the "From Library" combat setup panel, alongside the existing encounter selector
- **New**: When a party is selected, only that party's characters are added to combat (replacing the all-characters auto-add)
- **New**: Characters already present in `setupCombatants` (quick-entry section) are silently skipped on party selection (deduplication)
- **New**: No party selected preserves current behavior — all library characters are added
- **New**: `selectedPartyId` is cleared when combat ends
- **New**: `lib/utils/partySelection.ts` utility module with `expandPartyToCharacters()` and `findDuplicatePartyCharacters()` helpers
- **Existing unchanged**: encounter selector, quick entry flow, `startCombatWithSetupCombatants()` overall structure

## Capabilities

### New Capabilities

- `party-selection-for-combat`: Allows users to optionally select a party in the combat setup "From Library" panel. When selected, only the party's characters are added to combat instead of all library characters. Silently deduplicates against characters already in setupCombatants.

### Modified Capabilities

<!-- No existing spec-level behavior is changing — this is a new, additive capability -->

## Impact

**Code affected:**
- `app/combat/page.tsx` — add `parties` state, `selectedPartyId` state, `selectParty()` handler, party fetch in initial data load, party dropdown UI, branch logic in `startCombatWithSetupCombatants()`
- `lib/utils/partySelection.ts` — new utility file (port from `feature/30-select-party-for-combat` branch)
- `app/api/parties/route.ts` — no changes; existing endpoint already returns `characterIds`

**APIs:** No new endpoints. Adds `GET /api/parties` to the combat page's initial data load (already used elsewhere).

**Dependencies:** None new.

**Risks:**
- Low — the party selector is optional and the fallback (no party selected) preserves current behavior exactly
- Deduplication must correctly match `character-${id}` IDs in `setupCombatants` vs raw character `id` values

**Open Questions:** None — design decisions were confirmed during exploration.

**Non-Goals:**
- Multi-party selection (selecting more than one party at a time)
- Auto-syncing party roster changes into an active combat session
- Any changes to the Party data model
- Party visibility/permission filtering
