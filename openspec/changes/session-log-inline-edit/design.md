## Context

- Relevant architecture: Next.js React Server Components / Client Components. The `app/campaigns/[id]/sessions/page.tsx` is a client component that manages the state for viewing and editing session logs.
- Dependencies: None added or changed.
- Interfaces/contracts touched: React component structure in `SessionsContent` inside `app/campaigns/[id]/sessions/page.tsx`.

## Goals / Non-Goals

### Goals

- Move the Session Edit form inline to replace the SessionEntryCard of the session being edited.
- Maintain the New Session form at the top of the list.

### Non-Goals

- Refactoring the `SessionForm` into a separate file.
- Changing API routes or data models.

## Decisions

### Decision 1: Inline Form Rendering

- Chosen: Use a ternary in the `logs.map` array to render either `<SessionForm existing={log} ... />` if `editingLog?.id === log.id`, else `<SessionEntryCard>`.
- Alternatives considered: Adding an `isEditing` state to the `SessionEntryCard` itself and rendering the form inside it.
- Rationale: The form relies heavily on data from the parent `SessionsContent` component (like `allMembers`, `campaignId`, `sinceCombatDate`, etc.). Passing all of these into `SessionEntryCard` just to pass them to `SessionForm` would create prop drilling. Rendering `SessionForm` directly in the map loop keeps state where it belongs.
- Trade-offs: The map function gets slightly larger, but it perfectly matches the pattern already established in encounters.

### Decision 2: Top-Level Form Condition

- Chosen: Change the condition for the top-level form to `showForm && !editingLog`.
- Alternatives considered: Keeping a single form and using absolute positioning to float it over the card.
- Rationale: A floating absolute form would require tracking scroll positions and window resizes, which is brittle. Inline rendering is robust and standard.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Render `<SessionForm>` inline for editing existing sessions.
  - Design decision: Inline Form Rendering (Decision 1)
  - Validation approach: Manual UI verification that clicking "Edit" transforms the card into a form in place.

- Proposal element: Keep "New Session" form at the top.
  - Design decision: Top-Level Form Condition (Decision 2)
  - Validation approach: Verify clicking "+ New Session" still opens the form at the top of the list.

## Functional Requirements Mapping

- Requirement: Editing a session must not open a form at the top of the page.
  - Design element: Decision 1 & Decision 2
  - Acceptance criteria reference: TBD in specs
  - Testability notes: Can be verified by rendering the component in a test environment or via manual QA.

## Non-Functional Requirements Mapping

- Requirement category: UX / operability
  - Requirement: The scroll position should remain stable when entering edit mode.
  - Design element: Inline Form Rendering
  - Acceptance criteria reference: TBD in specs
  - Testability notes: Manual verification that jumping to top of page doesn't occur.

## Risks / Trade-offs

- Risk/trade-off: Visual layout of the form might be slightly constrained within the list wrapper compared to the top of the page.
  - Impact: Low
  - Mitigation: CSS classes on the form already provide sufficient padding and structure.

## Rollback / Mitigation

- Rollback trigger: The edit form breaks or becomes unusable.
- Rollback steps: Revert the PR.
- Data migration considerations: N/A.
- Verification after rollback: Ensure edit form functions as it originally did.

## Operational Blocking Policy

- If CI checks fail: Fix before merge.
- If security checks fail: Fix before merge.
- If required reviews are blocked/stale: Ping reviewer.
- Escalation path and timeout: DM project lead.

## Open Questions

- None.
