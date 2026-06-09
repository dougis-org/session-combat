## Context

- Relevant architecture: `lib/components/Toast.tsx` exports `useToast()` (state hook with ref-based 3s timer) and `<Toast>` (rendering component). Three locations currently duplicate this pattern inline.
- Dependencies: `lib/components/Toast.tsx` (stable, no changes needed). `lib/hooks/useCombat.ts`, `lib/components/ActiveCombatView.tsx`, `lib/components/QuickCombatantModal.tsx`.
- Interfaces/contracts touched:
  - `UseCombatReturn` (interface in `lib/hooks/useCombat.ts`): `setToast` removed, `showToast` added
  - `QuickCombatantModalProps` (interface in `lib/components/QuickCombatantModal.tsx`): `showToast?: boolean` renamed to `enableToast?: boolean`

## Goals / Non-Goals

### Goals

- Replace all inline toast state + timer patterns with `useToast()` + `<Toast>`
- Ensure consistent toast styling (shared component's `rounded-full`, `bg-green-700`/`bg-red-700`) across all affected components
- Expose `showToast` on `UseCombatReturn` for future use (replaces currently non-functional `setToast`)
- All existing tests pass after migration

### Non-Goals

- Modifying `lib/components/Toast.tsx`
- Adding new toast triggers
- Changing toast positioning or animation
- Extracting a React context for toast state

## Decisions

### Decision 1: Replace inline state/effect with `useToast()` in each component

- Chosen: Call `const { toast, showToast } = useToast()` directly in each component/hook.
- Alternatives considered: A shared React context (provider at app root) that exposes a single `showToast` globally.
- Rationale: Per-component `useToast()` is sufficient — toasts are already scoped to each component (modal has its own toast, combat view has its own). A context would be over-engineering for this scale.
- Trade-offs: Multiple `useToast` instances means two toasts could technically show simultaneously if both components are mounted. Acceptable — this matches the existing behaviour.

### Decision 2: Rename `showToast` prop on `QuickCombatantModal` to `enableToast`

- Chosen: Rename the boolean prop to `enableToast`.
- Alternatives considered: Alias the `useToast()` destructure (`const { toast, showToast: triggerToast } = useToast()`).
- Rationale: Renaming the prop is cleaner at call sites and removes the semantic confusion between a function and a boolean named the same thing. The prop is only used in 3 test call sites and no production callers.
- Trade-offs: Minor breaking change at call sites; all internal, all updated in the same PR.

### Decision 3: Unify toast duration to 3 seconds

- Chosen: Accept `useToast()`'s 3-second default for all components, including `QuickCombatantModal` (previously 2 seconds).
- Alternatives considered: Add a `duration` parameter to `useToast()`.
- Rationale: Avoid scope creep; the 1-second difference is not user-observable in practice. If duration config is needed, it should be a separate change to `Toast.tsx`.
- Trade-offs: Toast in `QuickCombatantModal` lingers 1 second longer — cosmetic only.

## Proposal to Design Mapping

- Proposal element: Replace `useCombat` inline state/timer
  - Design decision: Decision 1
  - Validation approach: Unit test that `UseCombatReturn` no longer has `setToast`, does have `showToast`; `ActiveCombatView` renders `<Toast>` component

- Proposal element: Replace `QuickCombatantModal` inline state/timer
  - Design decision: Decision 1
  - Validation approach: Existing toast behaviour tests pass; toast renders after add actions

- Proposal element: Naming collision on `showToast` prop
  - Design decision: Decision 2
  - Validation approach: TypeScript compilation; tests using `enableToast` prop pass

- Proposal element: Timer duration difference
  - Design decision: Decision 3
  - Validation approach: No test changes needed (tests mock timers; duration is incidental)

## Functional Requirements Mapping

- Requirement: `ActiveCombatView` renders `<Toast>` from shared component
  - Design element: Replace inline div at `lib/components/ActiveCombatView.tsx:410-416`
  - Acceptance criteria reference: specs/toast-migration/spec.md — ActiveCombatView renders Toast component
  - Testability notes: Render test with a `toast` prop set; assert `role="status"` element present

- Requirement: `useCombat` exposes `showToast` (not `setToast`) on its return
  - Design element: `useToast()` called inside `useCombat`; `UseCombatReturn` updated
  - Acceptance criteria reference: specs/toast-migration/spec.md — UseCombatReturn interface
  - Testability notes: TypeScript check; fixture updated; no runtime test needed

- Requirement: `QuickCombatantModal` shows toast on add monster/character success and error
  - Design element: 4 `setToast(...)` calls replaced with `showToast(...)`
  - Acceptance criteria reference: specs/toast-migration/spec.md — QuickCombatantModal toast triggers
  - Testability notes: Existing tests cover these paths; verify they still pass unchanged

- Requirement: `QuickCombatantModal` respects `enableToast` prop
  - Design element: Boolean prop renamed; conditional wrapping `showToast` calls preserved
  - Acceptance criteria reference: specs/toast-migration/spec.md — enableToast prop
  - Testability notes: Existing `showToast=false` tests updated to use `enableToast=false`

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Rapid consecutive adds should not stack toasts or leave orphaned timers
  - Design element: `useToast()` uses `useRef` to cancel the previous timer on each `showToast` call
  - Acceptance criteria reference: N/A (improvement over inline; no explicit test needed)
  - Testability notes: Manual test; unit test with fake timers if desired

- Requirement category: operability
  - Requirement: TypeScript compilation must pass after interface change
  - Design element: `UseCombatReturn` and `QuickCombatantModalProps` updated consistently
  - Acceptance criteria reference: CI TypeScript check
  - Testability notes: `npm run build` or `tsc --noEmit`

## Risks / Trade-offs

- Risk/trade-off: `setToast` removed from `UseCombatReturn` — any future code added between now and merge that calls `setToast` would break
  - Impact: Low; confirmed no current external callers
  - Mitigation: Merge promptly; PR description notes the interface change

## Rollback / Mitigation

- Rollback trigger: CI failure on TypeScript or unit tests that cannot be resolved
- Rollback steps: Revert the PR; no data migration involved
- Data migration considerations: None
- Verification after rollback: `npm run test:unit` and `tsc --noEmit` pass on main

## Operational Blocking Policy

- If CI checks fail: Fix the failure before merging; do not use `--no-verify` or skip checks
- If security checks fail: Treat as blocking; this change touches no auth or data access paths so security failures indicate an unrelated issue
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to maintainer after 48 hours
- Escalation path and timeout: PR author resolves within 72 hours or closes and re-opens after addressing feedback

## Open Questions

No open questions. All decisions resolved during exploration and proposal phases.
