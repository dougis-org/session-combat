## Context

- **Relevant architecture:** `app/combat/page.tsx` is a Next.js `'use client'` page. All child components in this file are currently co-located. `lib/components/` already contains extracted combat-adjacent components (`LairActionsSlot`, `LegendaryActionsPanel`, `CreatureStatBlock`, `QuickCombatantModal`). `lib/hooks/` contains `useAuth` and `useNetworkStatus`.
- **Dependencies:** No new npm dependencies. All imports are from existing `lib/utils/combat`, `lib/utils/hpHistory`, `lib/combat/conditionExpiry`, `lib/types`, and `lib/constants`.
- **Interfaces/contracts touched:** `CombatantCard` and `InitiativeEntry` are currently exported from `app/combat/page.tsx` and imported by two unit test files. Those import paths change. No public API surface beyond the file system.

## Goals / Non-Goals

### Goals

- Extract all state and server interactions into a single `useCombat` hook
- Extract the two render phases into focused view components
- Extract the three in-file components into standalone files under `lib/`
- Update unit test imports; add hook unit tests
- Preserve identical runtime behaviour — E2E tests pass without modification

### Non-Goals

- Logic changes, UI changes, new features
- Campaign-scoped route `/campaigns/[id]/combat` (tracked in #206)

## Decisions

### Decision 1: `useCombat` owns all server state, setup state, and handlers — including lair form state

- **Chosen:** `useCombat` returns server state (`combatState`, `encounters`, `characters`, `monsterTemplates`, `parties`), setup state (`setupCombatants`, `selectedEncounterId`, `selectedPartyId`), lair form state (`showLairForm`, `lairFormName`, `lairFormSeedMonster`), all derived values, and all handlers.
- **Alternatives considered:** Split lair form state into `CombatSetupView` / `ActiveCombatView`; split setup state out into a separate `useCombatSetup` hook.
- **Rationale:** `confirmAddLair` reads all three lair form fields AND branches on `combatState`, so it requires access to both setup-phase state and the active state. Co-locating handler and its state in one hook avoids prop-drilling or a second hook dependency. A single hook is simpler for the #206 reuse case.
- **Trade-offs:** `useCombat` return object is large (~25 values). Acceptable for an explicit extraction with no API consumers outside the combat page family.

### Decision 2: `initiativeEditId`, scroll `useEffect`, and `initiativePanelRef` stay local in `ActiveCombatView`

- **Chosen:** These three items remain in the view component, not the hook.
- **Alternatives considered:** Pass `initiativeEditId` through `useCombat` and accept that scrolling behaviour is lost.
- **Rationale:** `initiativePanelRef` is a DOM ref — hooks cannot hold refs that are attached to rendered elements. The `useEffect` that triggers the scroll reads the ref, so both must live in the component that renders the panel. Putting `initiativeEditId` in the hook would sever that connection.
- **Trade-offs:** `ActiveCombatView` has a small amount of local state that is not in the hook. This is intentional and documented.

### Decision 3: `setupCombatantsRef` moves into `useCombat` alongside `setupCombatants`

- **Chosen:** The `useRef<CombatantState[]>` shadow and its sync `useEffect` travel with `setupCombatants` into the hook.
- **Alternatives considered:** Remove the ref and rely on `setupCombatants` state directly in `addCombatantFromLibrary`.
- **Rationale:** `addCombatantFromLibrary` is called inside an async/event context where `setupCombatants` state may be stale. The ref provides an always-current snapshot. Removing it would introduce a duplicate-name detection regression. The ref is an implementation detail of the hook; callers never see it.
- **Trade-offs:** Slightly unusual hook internals; mitigated by test coverage.

### Decision 4: Keep `loadingTemplates` state

- **Chosen:** The `loadingTemplates` state proves to be used in JSX as a prop to `<QuickCombatantModal>` and `<LairForm>`. Therefore, we will keep it and include it in the `useCombat` hook.
- **Alternatives considered:** Drop it.
- **Rationale:** Since it is consumed by child components, dropping it would break UI signaling.
- **Trade-offs:** We pass one more prop.

### Decision 5: File placement — `lib/components/` for components, `lib/hooks/` for hook

- **Chosen:** `lib/components/CombatantCard.tsx`, `lib/components/InitiativeEntry.tsx`, `lib/components/CombatSetupView.tsx`, `lib/components/ActiveCombatView.tsx`, `lib/components/CombatantDetailPanel.tsx`, `lib/hooks/useCombat.ts`
- **Alternatives considered:** `app/combat/` subdirectory for view components.
- **Rationale:** `lib/components/` already holds extracted combat components. Keeping parity with existing conventions. `lib/hooks/` follows existing `useAuth`, `useNetworkStatus` precedent.
- **Trade-offs:** `CombatSetupView` and `ActiveCombatView` are specific to this route, not truly reusable. Acceptable because they will be reused by `/campaigns/[id]/combat` in #206.

### Decision 6: Unit test import paths updated; no re-export bridge in `page.tsx`

- **Chosen:** Update test imports directly. `page.tsx` will not re-export `CombatantCard` or `InitiativeEntry`.
- **Alternatives considered:** Add `export { CombatantCard } from '@/lib/components/CombatantCard'` to `page.tsx` during transition.
- **Rationale:** Re-exports add indirection and defeat the goal of a thin shell. The issue's acceptance criteria explicitly requires `page.tsx` under 30 lines. Updating two test file imports is trivial.
- **Trade-offs:** Tests must be updated before CI passes.

## Proposal to Design Mapping

- **Proposal element:** `useCombat` hook encapsulates all state and data fetching
  - **Design decision:** Decision 1 — hook owns all server state, setup state, and handlers
  - **Validation approach:** `useCombat` unit tests; E2E combat tests unchanged

- **Proposal element:** `setupCombatantsRef` must travel with `setupCombatants`
  - **Design decision:** Decision 3 — ref moves into hook
  - **Validation approach:** New `useCombat` unit test covers duplicate-name detection across rapid adds

- **Proposal element:** `initiativeEditId` + scroll effect + ref cannot go in hook
  - **Design decision:** Decision 2 — these stay in `ActiveCombatView`
  - **Validation approach:** E2E test covering initiative entry scroll; code review checkpoint

- **Proposal element:** Lair form state must co-locate with `confirmAddLair`
  - **Design decision:** Decision 1 — all three lair form fields in hook
  - **Validation approach:** `useCombat` unit test for dual-phase `confirmAddLair`

- **Proposal element:** Unit test import paths break
  - **Design decision:** Decision 6 — update imports, no bridge
  - **Validation approach:** Both unit test files pass after import update

## Functional Requirements Mapping

- **Requirement:** `CombatantCard` and `InitiativeEntry` live in `lib/components/`
  - **Design element:** Decision 5 (file placement)
  - **Acceptance criteria:** Files exist at `lib/components/CombatantCard.tsx` and `lib/components/InitiativeEntry.tsx`
  - **Testability notes:** Existing unit tests pass after import update

- **Requirement:** `page.tsx` reduced to under 30 lines
  - **Design element:** All content extracted; only `ProtectedRoute` + `CombatContent` call remains
  - **Acceptance criteria:** `wc -l app/combat/page.tsx` ≤ 30
  - **Testability notes:** Line count check in CI or manual verification

- **Requirement:** Existing E2E tests pass without modification
  - **Design element:** Structural refactor only — no logic changes
  - **Acceptance criteria:** `tests/e2e/combat.spec.ts` passes
  - **Testability notes:** Playwright E2E suite

- **Requirement:** `useCombat` hook encapsulates all state and data fetching
  - **Design element:** Decision 1
  - **Acceptance criteria:** No `useState`/`useEffect` for data fetching in any view component; all in hook
  - **Testability notes:** Unit tests for hook return shape and handler behaviour

## Non-Functional Requirements Mapping

- **Requirement category:** reliability
  - **Requirement:** No runtime regressions in combat behaviour
  - **Design element:** Pure structural extraction — no logic modified
  - **Acceptance criteria:** E2E suite green
  - **Testability notes:** Run full Playwright suite after each major extraction step

- **Requirement category:** operability
  - **Requirement:** TypeScript compiles cleanly with no new `any` types
  - **Design element:** `UseCombatReturn` interface typed explicitly; all props typed
  - **Acceptance criteria:** `npx tsc --noEmit` exits 0
  - **Testability notes:** TypeScript check in CI

## Risks / Trade-offs

- **Risk/trade-off:** `setupCombatantsRef` omitted from hook → silent duplicate detection failure
  - **Impact:** Medium — functional regression not caught by type checker
  - **Mitigation:** Explicit task checklist item; dedicated unit test

- **Risk/trade-off:** `initiativePanelRef` scroll moved into hook → scroll stops working
  - **Impact:** Low — UX regression, no data loss
  - **Mitigation:** Decision 2 documented and referenced in task; review checkpoint

- **Risk/trade-off:** Large hook return object couples consumers tightly
  - **Impact:** Low now; could complicate future splits
  - **Mitigation:** Acceptable for this use case; #206 will reuse the hook as-is

## Rollback / Mitigation

- **Rollback trigger:** E2E tests fail or TypeScript errors cannot be resolved within the PR
- **Rollback steps:** Revert PR — no database schema changes, no API changes, no data migrations
- **Data migration considerations:** None
- **Verification after rollback:** `tests/e2e/combat.spec.ts` green on main branch

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix TypeScript errors and test failures before requesting review.
- **If security checks fail:** Treat as CI failure; this refactor has no new network calls or auth changes.
- **If required reviews are blocked/stale:** Ping reviewer after 48 hours; escalate to repo owner after 72 hours.
- **Escalation path:** Repo owner (`dougis`).

## Open Questions

No open questions. All design decisions were resolved during codebase exploration before proposal was written.
