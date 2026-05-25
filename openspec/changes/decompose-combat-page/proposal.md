## GitHub Issues

- #215
- #206 (unblocked by this change)

## Why

- **Problem statement:** `app/combat/page.tsx` is 2410 lines containing three components and all combat logic in a single file. `CombatContent` alone is ~1255 lines with ~25 `useState` calls, all data fetching, and all combat action handlers. It cannot be embedded in a new layout or reused across routes.
- **Why now:** Issue #206 (combat event auto-capture) requires moving combat to a campaign-scoped route `/campaigns/[id]/combat`. That migration is blocked until the combat page is broken into composable pieces that can be embedded in a new layout without copying the entire file.
- **Business/user impact:** No user-visible change. Pure structural refactor that unblocks the #206 feature.

## Problem Space

- **Current behavior:** All combat state, data fetching, handler logic, setup-phase UI, and active-combat UI live in one 1255-line render function inside a single 2410-line file.
- **Desired behavior:** `app/combat/page.tsx` is a thin shell (~30 lines). A `useCombat` hook encapsulates all state and server interactions. Focused view components render each phase.
- **Constraints:**
  - Zero behaviour changes — E2E tests must pass without modification.
  - `CombatantCard` and `InitiativeEntry` are already exported from `page.tsx` and imported by unit tests at `@/app/combat/page`; those import paths break on move and must be updated.
  - `setupCombatantsRef` is a stale-closure workaround that must travel with `setupCombatants` into `useCombat` — cannot be left in the view.
  - `initiativeEditId` + its scroll `useEffect` + `initiativePanelRef` are DOM-coupled and must stay local in `ActiveCombatView` — they cannot live in the hook.
  - Lair form state (`showLairForm`, `lairFormName`, `lairFormSeedMonster`) must co-locate with `confirmAddLair` inside `useCombat` because the handler reads all three.
- **Assumptions:**
  - `loadingTemplates` state appears to be dead (set but never used to gate UI). Will be dropped unless evidence of usage is found during implementation.
  - No new TypeScript types are needed beyond what already exists in `lib/types.ts`.
- **Edge cases considered:**
  - `confirmAddLair` and `addCombatantFromLibrary` are dual-phase handlers that branch on `combatState !== null`. Both stay in `useCombat` where both `combatState` and `setupCombatants` are available.
  - Three separate `CombatantCard` renders exist in active combat (lair slot, players grouped, enemies grouped). All three move to `ActiveCombatView` together.
  - The detail panel (lines 1042–1200) is inline JSX wrapping `CreatureStatBlock`. Extracted as `CombatantDetailPanel` with `combatant`, `detailPosition`, and `onClose` props.

## Scope

### In Scope

- Create `lib/hooks/useCombat.ts` extracting all state, data fetching, and handlers from `CombatContent`
- Move `CombatantCard` → `lib/components/CombatantCard.tsx`
- Move `InitiativeEntry` → `lib/components/InitiativeEntry.tsx`
- Create `lib/components/CombatSetupView.tsx` (setup-phase render path)
- Create `lib/components/ActiveCombatView.tsx` (active combat render path)
- Create `lib/components/CombatantDetailPanel.tsx` (combatant detail overlay)
- Reduce `app/combat/page.tsx` to a thin shell under 30 lines
- Update unit test imports in `tests/unit/components/CombatantCard.test.tsx` and `tests/unit/combat/initiativeEntry.test.tsx`
- Add unit tests for `useCombat` covering dual-phase handlers and ref sync
- Verify existing E2E tests pass without modification

### Out of Scope

- Any logic changes to combat behaviour
- The campaign-scoped route `/campaigns/[id]/combat` (that is #206)
- UI changes of any kind
- New features

## What Changes

- `app/combat/page.tsx` reduced from 2410 lines to ~30 lines
- **New files:**
  - `lib/hooks/useCombat.ts`
  - `lib/components/CombatantCard.tsx`
  - `lib/components/InitiativeEntry.tsx`
  - `lib/components/CombatSetupView.tsx`
  - `lib/components/ActiveCombatView.tsx`
  - `lib/components/CombatantDetailPanel.tsx`
- **Modified test files:**
  - `tests/unit/components/CombatantCard.test.tsx` — import path update + new tests
  - `tests/unit/combat/initiativeEntry.test.tsx` — import path update
- **New test files:**
  - `tests/unit/hooks/useCombat.test.ts` — hook unit tests

## Risks

- **Risk:** `setupCombatantsRef` accidentally left in view instead of hook
  - **Impact:** Duplicate combatant name detection silently breaks (race condition — no immediate test failure)
  - **Mitigation:** Explicit task step; test coverage for duplicate detection added to `useCombat` tests

- **Risk:** `initiativePanelRef` scroll effect moved into hook
  - **Impact:** Smooth scroll to initiative panel stops working (behavioural regression, not caught by unit tests)
  - **Mitigation:** Design doc explicitly marks this as view-local; code review checkpoint in tasks

- **Risk:** Unit test import paths not updated before CI runs
  - **Impact:** CI fails on day 1
  - **Mitigation:** Import path updates are the first task step

- **Risk:** `loadingTemplates` dropped when it was actually used
  - **Impact:** Missing loading indicator somewhere
  - **Mitigation:** Grep for `loadingTemplates` in JSX before dropping; task step to confirm

## Open Questions

No unresolved ambiguity. All key constraints and implementation decisions were mapped during exploration of the codebase before this proposal was written.

## Non-Goals

- Changing any combat behaviour
- Adding new UI
- Migrating to the campaign-scoped route (that is #206's job)
- Converting class components (there are none)
- Adding error boundaries

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
