## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: MODIFIED Profile Page

The system SHALL provide a profile settings page that allows authenticated users to view
and modify their preferences, including a toggle for `combat.autoScrollToNextCombatant`
presented alongside the existing dice and chat preference controls.

#### Scenario: Edit combat auto-scroll preference

- **Given** an authenticated user is on the `/profile` page
- **When** they toggle "Auto-scroll to next combatant"
- **Then** the `usePreferences` context updates immediately and syncs with the server, matching the existing dice/chat toggle behavior.

## Traceability

- Proposal element: Surface toggle on `/profile` following existing dice/chat pattern -> Requirement: MODIFIED Profile Page
- Design decision: Decision 4 (toggle placement and presentation) -> Requirement: MODIFIED Profile Page
- Requirement: MODIFIED Profile Page -> Task(s): add toggle control to `app/profile/page.tsx`, extend `tests/unit/app/profile/page.test.tsx`

## Non-Functional Acceptance Criteria

### Requirement: Performance

Not affected — the new toggle uses the same optimistic-update path as every other control on this page. No distinct scenario applies.

### Requirement: Security

See functional scenario above ("Edit combat auto-scroll preference") and the existing "Access control" scenario in this capability, which already covers unauthenticated access to `/profile`. No distinct security scenario applies.

### Requirement: Reliability

Not affected beyond the existing offline-first reconciliation already covered by the `user-preferences` capability's reliability scenarios. No distinct scenario applies here.
