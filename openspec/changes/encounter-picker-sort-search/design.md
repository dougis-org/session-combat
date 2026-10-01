## Context

- Relevant architecture: `CombatSetupView` (`lib/components/CombatSetupView.tsx`) receives `combat: UseCombatReturn`; `encounters` come from `useCombat` and are scoped by `campaignId` when set. Used by `/combat` and `/campaigns/[id]/combat`.
- Dependencies: None new. Pattern reference: `app/monsters/filterUtils.ts`.
- Interfaces/contracts touched: `CombatSetupView` internal state only; `UseCombatReturn` unchanged.

## Goals / Non-Goals

### Goals

- Alphabetically sorted encounter options.
- Name search box that filters options.
- Selected encounter never silently dropped from the select.

### Non-Goals

- Combobox widget, server-side search, hook changes.

## Decisions

### Decision 1: Native `<select>` plus search input (option A)

- Chosen: Text input above the existing `<select>`.
- Alternatives considered: Custom combobox/listbox (B).
- Rationale: Small change, consistent with existing pickers, keeps existing tests valid, native a11y.
- Trade-offs: Less polished than a combobox; long lists still use native dropdown.

### Decision 2: Pure helper `filterAndSortEncounters`

- Chosen: `lib/utils/encounterFilter.ts` with signature `(encounters, query, selectedId) => Encounter[]`. Sorts with `localeCompare(b, undefined, { sensitivity: 'base' })`, filters by trimmed lowercase substring, and always includes the encounter whose id equals `selectedId`.
- Alternatives considered: Inline in component; sort in `useCombat`.
- Rationale: Easy unit testing; hook data order stays unchanged for other consumers.
- Trade-offs: One extra file.

### Decision 3: Component wiring

- Chosen: `useState` for `encounterQuery`, `useMemo` for options. Search input has `aria-label="Search encounters"`. When query is non-empty and the filtered list (excluding the retained selection) is empty, render "No encounters match" text beneath the select. Search box hidden in the campaign empty state.
- Alternatives considered: Threshold-based visibility.
- Rationale: Predictable UI; requester agreed.
- Trade-offs: Slight extra vertical space for short lists.

## Proposal to Design Mapping

- Proposal element: Alphabetical sort
  - Design decision: Decision 2
  - Validation approach: Unit tests on helper; component test on option order.
- Proposal element: Search box
  - Design decision: Decisions 1, 3
  - Validation approach: Component test typing into the input; E2E.
- Proposal element: Selected retention edge case
  - Design decision: Decision 2
  - Validation approach: Helper and component tests.
- Proposal element: No-match message / empty-state unchanged
  - Design decision: Decision 3
  - Validation approach: Component tests.

## Functional Requirements Mapping

- Requirement: Sorted options
  - Design element: Helper sort
  - Acceptance criteria reference: specs/combat-encounter-picker-search/spec.md, "Options sorted alphabetically"
  - Testability notes: Deterministic input arrays.
- Requirement: Search filters by name
  - Design element: Helper filter + input
  - Acceptance criteria reference: "Search filters options by name"
  - Testability notes: RTL `userEvent.type`.
- Requirement: Selection retained
  - Design element: Helper `selectedId` param
  - Acceptance criteria reference: "Selected encounter stays visible when filtered out"
  - Testability notes: Pure function test.
- Requirement: No-match message
  - Design element: Component conditional
  - Acceptance criteria reference: "No matches shows message"
  - Testability notes: RTL query by text.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Filtering remains instantaneous for ~100 encounters.
  - Design element: `useMemo`, O(n log n) sort in memory.
  - Acceptance criteria reference: NFAC Performance in spec.
  - Testability notes: Helper unit test with 500 items completes without noticeable delay (no timing assertion; correctness only).
- Requirement category: operability
  - Requirement: Input is keyboard-accessible and labelled.
  - Design element: `aria-label`.
  - Acceptance criteria reference: NFAC Accessibility in spec.
  - Testability notes: `getByRole('searchbox'|'textbox', { name })`.

## Risks / Trade-offs

- Risk/trade-off: Native select with a separate search is two controls.
  - Impact: Minor UX roughness.
  - Mitigation: Revisit combobox as a follow-up.

## Rollback / Mitigation

- Rollback trigger: Regression in combat setup flow after merge.
- Rollback steps: Revert the PR (no schema or data changes).
- Data migration considerations: None.
- Verification after rollback: `npm run test:unit` and combat setup E2E pass.

## Operational Blocking Policy

- If CI checks fail: Diagnose, fix, push; never bypass or use `--admin`.
- If security checks fail: Remediate before merge; no waivers without an explicit human-accepted risk.
- If required reviews are blocked/stale: Re-request review; escalate to the user after 24h of no response.
- Escalation path and timeout: Report to the user after three unproductive fix iterations.

## Open Questions

- None unresolved.
