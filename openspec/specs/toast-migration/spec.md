## ADDED Requirements

This document details *changes* to requirements and is additive to the archived design document at `openspec/changes/archive/2026-06-09-migrate-toast-to-shared-component/design.md`, not a replacement.

### Requirement: ADDED `ActiveCombatView` renders shared Toast component

The system SHALL render `<Toast toast={toast} />` from `lib/components/Toast.tsx` in place of the inline fixed div.

#### Scenario: Toast is shown when toast state is set

- **Given** `ActiveCombatView` is rendered with a `combat` prop where `toast = { message: 'Combat saved!', type: 'success' }`
- **When** the component renders
- **Then** an element with `role="status"` containing the text `'Combat saved!'` is present in the DOM

#### Scenario: No toast shown when toast is null

- **Given** `ActiveCombatView` is rendered with `combat.toast = null`
- **When** the component renders
- **Then** no element with `role="status"` is present in the DOM

### Requirement: ADDED `QuickCombatantModal` renders shared Toast component

The system SHALL render `<Toast toast={toast} />` from `lib/components/Toast.tsx` in place of its inline fixed div.

#### Scenario: Toast shown after monster added successfully

- **Given** the modal is open with monster templates loaded and `enableToast` is `true` (default)
- **When** the user clicks "Add" on a monster
- **Then** an element with `role="status"` containing `"<name> added successfully"` appears

#### Scenario: Toast shown after character added successfully

- **Given** the modal is open with character templates loaded and `enableToast` is `true` (default)
- **When** the user clicks "Add" on a character
- **Then** an element with `role="status"` containing `"<name> added successfully"` appears

#### Scenario: Toast shown on add error regardless of `enableToast`

- **Given** the modal is open and `onAddMonster` throws an error, with `enableToast = false`
- **When** the user clicks "Add" on a monster
- **Then** an element with `role="status"` containing `'Failed to add monster'` appears

## MODIFIED Requirements

### Requirement: MODIFIED `UseCombatReturn` exposes `showToast` instead of `setToast`

The system SHALL expose `showToast(message: string, type: 'success' | 'error') => void` on `UseCombatReturn` in place of `setToast`.

#### Scenario: `showToast` function is available on the combat hook return

- **Given** `useCombat()` is called
- **When** the return value is inspected
- **Then** it includes a `showToast` function and does not include `setToast`

### Requirement: MODIFIED `QuickCombatantModal` prop renamed from `showToast` to `enableToast`

The system SHALL accept `enableToast?: boolean` (default `true`) to control whether success toasts fire; error toasts fire unconditionally.

#### Scenario: Success toast suppressed when `enableToast` is false

- **Given** the modal is rendered with `enableToast={false}`
- **When** the user clicks "Add" on a monster
- **Then** no toast element with `role="status"` is shown for the success message

#### Scenario: Default `enableToast` shows toast

- **Given** the modal is rendered without the `enableToast` prop
- **When** the user clicks "Add" on a monster
- **Then** an element with `role="status"` containing the monster name appears

## REMOVED Requirements

### Requirement: REMOVED Inline toast state and timer in `useCombat`

Reason for removal: Replaced by `useToast()` from `lib/components/Toast.tsx`. The inline `useState` + `useEffect` pattern is deleted; `setToast` is removed from `UseCombatReturn`.

### Requirement: REMOVED Inline toast state and timer in `QuickCombatantModal`

Reason for removal: Replaced by `useToast()` from `lib/components/Toast.tsx`.

## Traceability

Proposal elements and Design Decisions referenced below are defined in the archived change at `openspec/changes/archive/2026-06-09-migrate-toast-to-shared-component/`.

- Proposal element "Replace useCombat inline state/timer" → Requirement: MODIFIED `UseCombatReturn` exposes `showToast`
- Proposal element "Replace ActiveCombatView inline div" → Requirement: ADDED `ActiveCombatView` renders shared Toast component
- Proposal element "Replace QuickCombatantModal inline state/timer" → Requirement: ADDED `QuickCombatantModal` renders shared Toast component
- Proposal element "Rename showToast prop" → Requirement: MODIFIED `QuickCombatantModal` prop renamed to `enableToast`
- Design Decision 1 (per-component `useToast()`) → All ADDED requirements
- Design Decision 2 (prop rename to `enableToast`) → MODIFIED `QuickCombatantModal` prop renamed
- Design Decision 3 (unify duration to 3s) → No explicit scenario (timer duration is internal; not user-observable in tests)
- ADDED `ActiveCombatView` renders Toast -> Task: Update ActiveCombatView
- ADDED `QuickCombatantModal` renders Toast -> Task: Update QuickCombatantModal
- MODIFIED `UseCombatReturn` -> Task: Update useCombat hook + fixture

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Rapid consecutive adds do not stack timers

- **Given** `useToast()` is used in `QuickCombatantModal`
- **When** the user clicks "Add" twice in quick succession
- **Then** only one toast is visible at a time and the previous dismiss timer is cancelled before the new one starts

> Implementation note: This is guaranteed by `useToast()`'s `useRef`-based timer cancellation (see `lib/components/Toast.tsx`). The `useToast` hook itself is the appropriate unit under test for this behaviour — integration-level tests for `QuickCombatantModal` need not duplicate it. A regression test should be added to `Toast.tsx`'s own test suite if one does not already exist.

### Requirement: Performance

> No latency budget applies — toast rendering is synchronous and trivial.

### Requirement: Security

> No access-control or auth concerns. See functional scenarios above for all behavioral coverage.
