## Context

- Relevant architecture: `InitiativeEntry` is a modal-style panel: `<h2>` title column + a scrollable content column (`min-w-0 flex-1 max-h-[70vh] overflow-y-auto`). Content currently has `flex justify-between` with three siblings.
- Dependencies: Tailwind utilities only; no new packages.
- Interfaces/contracts touched: None (props, callbacks, aria-labels, button text unchanged).

## Goals / Non-Goals

### Goals

- Entry input + Set button never clip off-screen and sit left-aligned below the mode buttons, under "Roll d20".

### Non-Goals

- Behavior, validation, or visual restyling changes.

## Decisions

### Decision 1: Two-column CSS grid for the content area

- Chosen: Content container becomes `grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-start`. Column 1 = name + type badge. Column 2 = a vertical stack of: mode buttons row, Advantage/Flat bonus row, entry/result div.
- Alternatives considered: (A) `flex-col` with `md:pl-*` padding on the entry div to approximate alignment.
- Rationale: Grid makes the controls column a single shared left edge, so the entry div aligns under "Roll d20" regardless of name length.
- Trade-offs: Slightly larger restructure than padding.

### Decision 2: Keep the entry div's own markup

- Chosen: Retain `<div className="flex items-start gap-2">` and its children unchanged; only its parent changes.
- Alternatives considered: Flattening the entry div into the grid.
- Rationale: Minimizes diff and test churn; issue text references this div explicitly.
- Trade-offs: One extra wrapper level.

### Decision 3: Mobile stays single column

- Chosen: `grid-cols-1` below `md`; name block, then buttons (already full-width stacked), then the rest — all left-aligned.
- Alternatives considered: Same two-column grid on mobile.
- Rationale: Matches existing `md:` breakpoint used by the button row.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Restructure into grid
  - Design decision: Decision 1
  - Validation approach: Unit test asserts grid container; manual browser check.
- Proposal element: Entry div below buttons, aligned under Roll d20
  - Design decision: Decisions 1, 2
  - Validation approach: Unit test asserts Roll d20 button and entry div share the controls-column wrapper, entry div after the buttons row.
- Proposal element: Mobile layout preserved
  - Design decision: Decision 3
  - Validation approach: Class assertion (`grid-cols-1`, `md:` variant); manual check at narrow width.

## Functional Requirements Mapping

- Requirement: Entry controls appear in the controls column beneath mode buttons
  - Design element: Decisions 1, 2
  - Acceptance criteria reference: specs/initiative-entry/spec.md — "Entry controls sit below mode buttons"
  - Testability notes: RTL DOM-structure assertions (`compareDocumentPosition`, shared parent).
- Requirement: Existing behavior unchanged
  - Design element: Decision 2
  - Acceptance criteria reference: specs/initiative-entry/spec.md — "Existing behavior preserved"
  - Testability notes: Existing `InitiativeEntry` suites must pass unmodified.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: No new dependencies; no behavior regressions.
  - Design element: Decision 2
  - Acceptance criteria reference: specs/initiative-entry/spec.md — Non-Functional Acceptance Criteria
  - Testability notes: Full unit suite + build.

## Risks / Trade-offs

- Risk/trade-off: Layout correctness can't be asserted in jsdom.
  - Impact: Regression could slip through.
  - Mitigation: Structural assertions plus a browser/Playwright visual check during validation.

## Rollback / Mitigation

- Rollback trigger: Layout regression found post-merge.
- Rollback steps: Revert the PR (single-file component change).
- Data migration considerations: None.
- Verification after rollback: Existing `InitiativeEntry` tests pass.

## Operational Blocking Policy

- If CI checks fail: Fix, validate locally, push; do not bypass or force-merge.
- If security checks fail: Remediate before merge.
- If required reviews are blocked/stale: Ping reviewer; escalate to the repo owner after 2 business days.
- Escalation path and timeout: Report stall to the user after three unproductive iterations.

## Open Questions

- None.
