# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/decompose-combat-page` then immediately `git push -u origin refactor/decompose-combat-page`

## Execution

### T1 — Confirm `loadingTemplates` is dead state

- [x] Run `grep -n "loadingTemplates" app/combat/page.tsx` and confirm it only appears in `useState` declaration and the data-loading `useEffect` — never in JSX conditionals or other consumers
- [x] If confirmed dead, note for removal in T2; if found in JSX, update spec and design before proceeding

### T2 — Create `lib/hooks/useCombat.ts`

- [x] Create `lib/hooks/useCombat.ts` with the `'use client'` directive
- [x] Move all imports from `app/combat/page.tsx` that are consumed by `CombatContent` into the hook file
- [x] Move all `useState` declarations into the hook (drop `loadingTemplates` if confirmed dead in T1) (NOTE: Found alive, keeping it)
- [x] **Critical:** Move `setupCombatantsRef = useRef<CombatantState[]>([])` and its sync `useEffect` into the hook alongside `setupCombatants` — do not leave the ref in any view component
- [x] Move the initial data-loading `useEffect` (all five parallel fetches) into the hook
- [x] Move the Escape key `useEffect` for `selectedDetailCombatantId` into the hook
- [x] Move the toast auto-dismiss `useEffect` into the hook
- [x] **Do NOT move:** `initiativePanelRef`, `initiativeEditId`, or the scroll `useEffect` — these stay in `ActiveCombatView` (Decision 2 in design.md)
- [x] Move all handler functions: `saveCombatState`, `addCombatantToSetup`, `removeCombatantFromSetup`, `cancelLairForm`, `confirmAddLair`, `selectParty`, `addCombatantToActiveSession`, `addCombatantFromLibrary`, `startCombatWithSetupCombatants`, `startCombat`, `endCombat`, `restartRound`, `rollInitiative`, `nextTurn`, `updateCombatant`, `updateCombatantInitiativeSettings`, `removeCombatant`, `setInitiativeRoll`, `hasInitiativeBeenRolled`, `getDisplayCombatants`
- [x] Move `zeroInitiative` (`useMemo`) and `filteredZeroInitiative` (derived) into the hook return
- [x] Define and export a `UseCombatReturn` interface covering all returned state and handlers
- [x] Return all state, handlers, and derived values from the hook
- [x] Verify: `npx tsc --noEmit` passes

### T3 — Move `CombatantCard` to `lib/components/CombatantCard.tsx`

- [x] Create `lib/components/CombatantCard.tsx`
- [x] Copy the `CombatantCard` function (lines 1277–2136) into the new file verbatim
- [x] Add all necessary imports (types from `@/lib/types`, utils from `@/lib/utils/combat`, `@/lib/utils/hpHistory`, constants from `@/lib/constants`, `@/lib/components/LegendaryActionsPanel`, `@/lib/components/LairActionsSlot`)
- [x] Export `CombatantCard` as a named export
- [x] Update `tests/unit/components/CombatantCard.test.tsx`: change `import { CombatantCard } from '@/app/combat/page'` → `import { CombatantCard } from '@/lib/components/CombatantCard'`
- [x] Run `npx jest tests/unit/components/CombatantCard.test.tsx` — all tests must pass
- [x] Verify: `npx tsc --noEmit` passes

### T4 — Move `InitiativeEntry` to `lib/components/InitiativeEntry.tsx`

- [x] Create `lib/components/InitiativeEntry.tsx`
- [x] Copy the `InitiativeEntryProps` interface and `InitiativeEntry` function (lines 2146–2410) into the new file verbatim
- [x] Add necessary imports (React hooks, `@/lib/types`, `@/lib/utils/dice` if used)
- [x] Export `InitiativeEntry` as a named export and `InitiativeEntryProps` as a type export
- [x] Update `tests/unit/combat/initiativeEntry.test.tsx`: change `import { InitiativeEntry } from '@/app/combat/page'` → `import { InitiativeEntry } from '@/lib/components/InitiativeEntry'`
- [x] Run `npx jest tests/unit/combat/initiativeEntry.test.tsx` — all tests must pass
- [x] Verify: `npx tsc --noEmit` passes

### T5 — Create `lib/components/CombatantDetailPanel.tsx`

- [x] Create `lib/components/CombatantDetailPanel.tsx`
- [x] Extract the detail overlay JSX (currently lines 1042–1200 of `app/combat/page.tsx`) into the component
- [x] Props: `combatant: CombatantState`, `detailPosition: {top: number, left: number}`, `onClose: () => void`
- [x] Import `CreatureStatBlock` from `@/lib/components/CreatureStatBlock`
- [x] Export `CombatantDetailPanel` as a named export
- [x] Verify: `npx tsc --noEmit` passes

### T6 — Create `lib/components/CombatSetupView.tsx`

- [x] Create `lib/components/CombatSetupView.tsx`
- [x] Extract the setup-phase render path (currently lines 513–738 of `app/combat/page.tsx`, the `if (!combatState)` early return block) into the component
- [x] Props: all setup-related state and handlers from `UseCombatReturn` that the setup UI consumes — `encounters`, `parties`, `characters`, `setupCombatants`, `selectedEncounterId`, `selectedPartyId`, `showQuickEntryType`, `showLairForm`, `lairFormName`, `lairFormSeedMonster`, `error`, and handlers `setSelectedEncounterId`, `selectParty`, `setShowQuickEntryType`, `addCombatantToSetup`, `removeCombatantFromSetup`, `startCombat`, `setShowLairForm`, `setLairFormName`, `setLairFormSeedMonster`, `confirmAddLair`, `cancelLairForm`
- [x] Import `QuickCombatantModal`, `LairForm`, `InitiativeEntry` from their new `lib/components/` paths
- [x] Export `CombatSetupView` as a named export
- [x] Verify: `npx tsc --noEmit` passes

### T7 — Create `lib/components/ActiveCombatView.tsx`

- [x] Create `lib/components/ActiveCombatView.tsx`
- [x] Extract the active combat render path (currently lines 740–1274 of `app/combat/page.tsx`) into the component
- [x] **Keep local in this component:** `initiativeEditId` state, `initiativePanelRef` ref, and the `useEffect` that calls `initiativePanelRef.current.scrollIntoView` on `initiativeEditId` change (Decision 2)
- [x] Props: all active-combat state and handlers from `UseCombatReturn` — `combatState`, `monsterTemplates`, `error`, `toast`, `showCombatantModal`, `showLairForm`, `lairFormName`, `lairFormSeedMonster`, `showEncounterDescription`, `removeConfirmId`, `removeConfirmPosition`, `selectedDetailCombatantId`, `detailPosition`, `initiativeFilter`, `zeroInitiative`, `filteredZeroInitiative`, and all handlers
- [x] Import `CombatantCard`, `InitiativeEntry`, `CombatantDetailPanel` from their new `lib/components/` paths
- [x] Import `LairActionsSlot`, `LegendaryActionsPanel`, `LairForm`, `QuickCombatantModal`, `CombatInfoIcon` from `lib/components/`
- [x] Export `ActiveCombatView` as a named export
- [x] Verify: `npx tsc --noEmit` passes

### T8 — Reduce `app/combat/page.tsx` to thin shell

- [x] Replace `app/combat/page.tsx` with:
  - `'use client'` directive
  - Imports: `useCombat`, `CombatSetupView`, `ActiveCombatView`, `ProtectedRoute`
  - `CombatContent` function that calls `useCombat()` and renders loading state, `CombatSetupView`, or `ActiveCombatView` depending on `loading` and `combatState`
  - Default export `CombatPage` wrapping `CombatContent` in `ProtectedRoute`
- [x] Verify: `wc -l app/combat/page.tsx` output ≤ 30
- [x] Verify: `npx tsc --noEmit` passes
- [x] Run full unit test suite: `npx jest` — all tests pass

### T9 — Write `tests/unit/hooks/useCombat.test.ts`

- [x] Create `tests/unit/hooks/` directory if it does not exist
- [x] Create `tests/unit/hooks/useCombat.test.ts`
- [x] Mock `fetch` globally for the test file
- [x] Mock `useAuth` to return a fake user
- [x] **Test: initial state** — hook returns `loading: true`, `combatState: null`, empty arrays before fetch completes
- [x] **Test: data load** — after fetch resolves, `loading: false`, `encounters`/`characters`/`parties` populated from mock responses
- [x] **Test: `addCombatantToSetup`** — adds combatant to `setupCombatants` and ref stays in sync (verify by calling `addCombatantFromLibrary` immediately after and confirming duplicate detection without re-render)
- [x] **Test: duplicate name detection via ref (stale closure coverage)** — add combatant named "Goblin" via `addCombatantToSetup`, then call `addCombatantFromLibrary` with another "Goblin" source before re-render; assert both are renamed "Goblin 1" / "Goblin 2"
- [x] **Test: `confirmAddLair` in setup phase** — with `combatState === null`, calling `confirmAddLair` adds a lair combatant to `setupCombatants` and clears form state
- [x] **Test: `confirmAddLair` in active phase** — with `combatState` set, calling `confirmAddLair` triggers a POST to `/api/combat` with the lair combatant appended
- [x] **Test: `addCombatantFromLibrary` routes to setup** — with `combatState === null`, combatant lands in `setupCombatants`, no POST made
- [x] **Test: `addCombatantFromLibrary` routes to active** — with `combatState` set, POST to `/api/combat` is made
- [x] **Test: `startCombat`** — transitions from setup to active, POSTs new `CombatState` with `isActive: true`
- [x] **Test: `endCombat`** — when user confirms, `combatState` becomes `null` and history is cleared
- [x] **Test: `nextTurn`** — advances `currentTurnIndex`; wraps to 0 and increments `currentRound` at end of round
- [x] **Test: `rollInitiative`** — all non-lair combatants get `initiativeRoll` set, combatants are sorted
- [x] Run `npx jest tests/unit/hooks/useCombat.test.ts` — all tests pass

### T10 — Enhance `CombatantCard` tests for moved component

- [x] Add to `tests/unit/components/CombatantCard.test.tsx`:
  - **Test: Undo button enabled after damage** — apply damage, confirm Undo button appears and is enabled
  - **Test: Undo calls `onUpdate` with previous HP** — push HP history, click Undo, verify `onUpdate` called with prior values
  - **Test: `onShowDetails` callback fires with position** — click the stat block / details trigger, verify `onShowDetails` called with `(combatantId, {top, left})`
  - **Test: `onShowRemoveConfirm` callback fires** — click the Remove button, verify `onShowRemoveConfirm` called

### T11 — Run E2E verification

- [x] Run `npx playwright test tests/e2e/combat.spec.ts` — all tests pass without any modification to the spec file
- [x] If any E2E test fails, diagnose as a logic regression (not a test update); fix in the appropriate extracted file

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] `npx tsc --noEmit` exits 0
- [x] `npx jest` — full unit suite passes
- [x] `npx playwright test tests/e2e/combat.spec.ts` — passes without modification
- [x] `wc -l app/combat/page.tsx` ≤ 30
- [x] No `useState` or data-fetching `useEffect` present in `CombatSetupView`, `ActiveCombatView`, `CombatantDetailPanel`, or `app/combat/page.tsx` (only `useCombat` and local UI state in `ActiveCombatView`)
- [x] `npx next build` completes successfully

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx jest`; all tests must pass
- **Integration tests** — `npx jest --config jest.integration.config.js` if applicable; all tests must pass
- **E2E tests** — `npx playwright test tests/e2e/combat.spec.ts`; all tests must pass
- **Build** — `npx next build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [x] Commit all changes and push to `refactor/decompose-combat-page`
- [x] Open PR from `refactor/decompose-combat-page` to `main`. PR body MUST include `Closes #215`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] Wait 180 seconds for CI to start
- [x] **Monitor PR comments** — poll autonomously; address each comment, commit fixes, validate locally, push; wait 180 seconds; repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll `gh pr checks <PR-URL> --json isRequired,state`; fix any required failures, commit, validate, push; wait 180 seconds; repeat until all required checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: assigned developer
- Reviewer(s): repo owner (`dougis`)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required (pure structural refactor)
- [x] Sync approved spec deltas into `openspec/specs/` if any capability specs were added
- [x] Archive: move `openspec/changes/decompose-combat-page/` to `openspec/changes/archive/YYYY-MM-DD-decompose-combat-page/` — stage both the copy and the deletion in a **single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-decompose-combat-page/` exists and `openspec/changes/decompose-combat-page/` is gone
- [x] Commit and push archive commit to `main`
- [x] `git fetch --prune` and `git branch -d refactor/decompose-combat-page`
