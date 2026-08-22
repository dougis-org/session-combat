## Context

- Relevant architecture: Next.js frontend pages (`app/characters/page.tsx`), standard React component extraction (`lib/components`).
- Dependencies: React, Next.js, `CreatureStatBlock`, internal state management (`useState`).
- Interfaces/contracts touched: We'll extract `CharacterEditor` to accept standard character editing props (`character`, `onSave`, `onCancel`, `isNew`). The `CharacterCard` component will accept the `character`, `onEdit`, and `onDelete` callbacks.

## Goals / Non-Goals

### Goals

- Present a compact summary of characters in the main listing view.
- Enable expanding individual characters on the main listing view to see the full `CreatureStatBlock`.
- Provide a dedicated, routable view for a single character at `/characters/[id]`.
- Allow editing from both the main listing and the detail view.

### Non-Goals

- Refactoring the entire `CreatureStatBlock` layout or functionality.
- Changing backend character storage or API endpoints.

## Decisions

### Decision 1: Create `CharacterCard` component

- Chosen: A new React component that wraps the character data and controls an `isExpanded` state.
- Alternatives considered: Keeping the state in the `CharactersContent` component mapped by ID, but that causes unnecessary renders of the whole list when one card toggles.
- Rationale: Component state encapsulates the behavior neatly.
- Trade-offs: Increases component count but improves maintainability.

### Decision 2: Extract `CharacterEditor`

- Chosen: Extract the inline `CharacterEditor` from `page.tsx` into `lib/components/CharacterEditor.tsx`.
- Alternatives considered: Duplicating the editor code in `[id]/page.tsx`.
- Rationale: Code reuse and single source of truth for character editing logic.
- Trade-offs: Minor refactoring overhead.

### Decision 3: Character detail route `/characters/[id]`

- Chosen: Use a client-side component structure similar to the main characters page to fetch the single character on mount.
- Alternatives considered: Server-side fetching.
- Rationale: Keeps consistency with the existing data fetching pattern in `app/characters/page.tsx` (`fetch('/api/characters')`).
- Trade-offs: Minor layout shift on load, consistent with the rest of the app.

## Proposal to Design Mapping

- Proposal element: Character listing shows summary by default.
  - Design decision: Create `CharacterCard` with `isExpanded` defaulting to `false`.
  - Validation approach: Manual visual check on load to ensure only summary is shown.
- Proposal element: Details expandable inline.
  - Design decision: `CharacterCard` state toggles `<CreatureStatBlock isCompact={false} />`.
  - Validation approach: Click test, verify block expands and collapses.
- Proposal element: Dedicated view for each character.
  - Design decision: Implement `app/characters/[id]/page.tsx`.
  - Validation approach: Navigate to route and verify character details load.
- Proposal element: Editing allowed in both places.
  - Design decision: Extract `CharacterEditor`.
  - Validation approach: Verify edit works in main list, and edit works in detail page.

## Functional Requirements Mapping

- Requirement: Users must be able to toggle character details in the list.
  - Design element: `CharacterCard` `Expand/Collapse` button.
  - Acceptance criteria reference: Specs - UI toggling.
  - Testability notes: Verify state transition in unit test or manual test.
- Requirement: Users must be able to edit from the detail page.
  - Design element: `CharacterEditor` usage in `[id]/page.tsx`.
  - Acceptance criteria reference: Specs - Detail View Edit.
  - Testability notes: Mock API call for character update from detail view.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Clean component extraction.
  - Design element: Extract `CharacterEditor` without altering its internal logic to minimize regression risk.
  - Acceptance criteria reference: Specs - Component extraction.
  - Testability notes: Ensure existing unit tests for `CharacterEditor` (if any) or related flows still pass.

## Risks / Trade-offs

- Risk/trade-off: Extracting `CharacterEditor` could break the complex multi-class or ability score state handling.
  - Impact: Broken character creation/editing.
  - Mitigation: Extract exactly as-is. Verify manually.

## Rollback / Mitigation

- Rollback trigger: Critical bugs in character listing or editing.
- Rollback steps: Revert the commit extracting `CharacterEditor` and changing `page.tsx`.
- Data migration considerations: N/A - no data changes.
- Verification after rollback: Open characters page and confirm it loads successfully.

## Operational Blocking Policy

- If CI checks fail: Resolve locally, run `npm run test` or `npm run lint`.
- If security checks fail: Reassess any new dependencies (none planned).
- If required reviews are blocked/stale: Ping reviewer.
- Escalation path and timeout: N/A for this scope.

## Open Questions

None
