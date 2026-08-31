## Context

- Relevant architecture: Next.js React Server Components and Client Components handling state for encounter lists.
- Dependencies: React state (`editingEncounter`, `isCreatingEncounter`).
- Interfaces/contracts touched: `app/encounters/page.tsx` and `app/campaigns/[id]/encounters/page.tsx` render logic.

## Goals / Non-Goals

### Goals

- Allow inline editing of encounters by replacing the `EncounterCard` with the `EncounterEditor` directly within the mapped list.
- Keep the create new encounter form at the top of the list.

### Non-Goals

- Refactoring the API layer.
- Changing the encounter creation workflow.

## Decisions

### Decision 1: Inline conditional rendering

- Chosen: In the `.map()` loop for encounters, conditionally render `EncounterEditor` if `editingEncounter?.id === encounter.id`, otherwise render `EncounterCard`.
- Alternatives considered: Programmatic scroll-to-top when edit is clicked, or rendering the editor in a fixed modal overlay.
- Rationale: The issue explicitly asked for the edit panel to "open in place over the encounter itself", which inline editing directly addresses. It's also the most robust way to solve this in React without dealing with browser scroll APIs.
- Trade-offs: The list item might change size significantly when switching to edit mode, causing surrounding items to shift.

### Decision 2: Separate states for Create and Edit

- Chosen: Use `isAddingEncounter` / `isCreatingEncounter` boolean states to render a top-level `EncounterEditor` for new creations, while using `editingEncounter` to trigger the inline editor in the list.
- Alternatives considered: Consolidating all creation and editing into a single state variable.
- Rationale: The current codebase already has these distinct states. Keeping them distinct makes it easy to leave the "create" workflow untouched while only modifying the "edit" workflow.
- Trade-offs: Slight duplication in how the `EncounterEditor` is invoked, but minimal risk.

## Proposal to Design Mapping

- Proposal element: Update the global encounters page (`app/encounters/page.tsx`) to render `EncounterEditor` inline.
  - Design decision: Decision 1: Inline conditional rendering.
  - Validation approach: Manual/E2E test verifying that clicking Edit on an existing encounter replaces the card in place.

- Proposal element: Update the campaign encounters page (`app/campaigns/[id]/encounters/page.tsx`) to render `EncounterEditor` inline.
  - Design decision: Decision 1: Inline conditional rendering.
  - Validation approach: Manual/E2E test verifying that clicking Edit on an existing campaign encounter replaces the card in place.

## Functional Requirements Mapping

- Requirement: Editing an existing encounter must show the `EncounterEditor` in the exact place of the original `EncounterCard`.
  - Design element: Decision 1 (Inline conditional rendering)
  - Acceptance criteria reference: Specs -> Encounter UI
  - Testability notes: Verify via Playwright E2E test that the editor container appears inside the list structure.

- Requirement: Creating a new encounter must show the `EncounterEditor` at the top of the screen.
  - Design element: Decision 2 (Separate states)
  - Acceptance criteria reference: Specs -> Encounter UI
  - Testability notes: Verify via Playwright E2E test that clicking Add New Encounter opens the editor at the top.

## Non-Functional Requirements Mapping

- Requirement category: performance/security/reliability/operability
  - Requirement: Maintain existing React performance without unnecessary re-renders.
  - Design element: Decision 1
  - Acceptance criteria reference: Specs -> Encounter UI
  - Testability notes: Ensure we are using `key={encounter.id}` properly when swapping the components.

## Risks / Trade-offs

- Risk/trade-off: Visual layout shift when editing an encounter.
  - Impact: Low.
  - Mitigation: The editor itself is fully responsive; users expect a size change when opening an edit form.

## Rollback / Mitigation

- Rollback trigger: The edit form breaks or crashes when rendered inline.
- Rollback steps: Revert the PR.
- Data migration considerations: None.
- Verification after rollback: Verify that the edit panel appears at the top again.

## Operational Blocking Policy

- If CI checks fail: Fix them.
- If security checks fail: Fix them.
- If required reviews are blocked/stale: Ping reviewers.
- Escalation path and timeout: Mention @dougis if stuck for over 24 hours.

## Open Questions

- None
