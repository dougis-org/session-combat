## Context

- Relevant architecture: The CombatantCard is a composition of several smaller components (CombatantCardHeader, HpControls, InitiativeControl). It currently uses `flex` heavily to lay out elements.
- Dependencies: React, Tailwind CSS classes.
- Interfaces/contracts touched: We are only changing internal div wrapping and layout classes; no API or state management changes are required.

## Goals / Non-Goals

### Goals

- Wrap top-level combatant card elements in semantically named `div`s.
- Enable `flex-wrap` on the outer and inner containers to prevent horizontal scrolling on mobile/small screens.
- Prepare a placeholder container for a future "quick roll" D20 icon.
- Ensure the layout degrades gracefully down to mobile widths.

### Non-Goals

- Refactoring `useCombatantHp` or any combat state logic.
- Building the actual per-card or global collapsing logic.
- Designing the D20 roll logic.

## Decisions

### Decision 1: Semantic Div Wrapping

- Chosen: Wrap fragments in `div`s with `data-card-section` attributes (e.g. `data-card-section="identity-stats"`).
- Alternatives considered: Using simple structural divs without semantic meaning.
- Rationale: The DM workflow requires collapsing specific panels eventually. Naming the sections with data attributes lays the groundwork for that logic cleanly.
- Trade-offs: Adds a few DOM nodes.

### Decision 2: Flex Wrap Configuration

- Chosen: Add `flex-wrap` to the top-level row and adjust gap spacing.
- Alternatives considered: Media queries with `grid` layouts.
- Rationale: `flex-wrap` is sufficient, simple, and naturally responds to the available container width without hardcoded breakpoints.
- Trade-offs: Items may wrap at awkward points if inner groupings are too wide, but the semantic groups prevent internal fracturing.

## Proposal to Design Mapping

- Proposal element: Group elements semantically and prevent horizontal overflow
  - Design decision: Implement semantic `div` wrapping with `flex-wrap`.
  - Validation approach: Verify visually by resizing the browser window to mobile width.

- Proposal element: Prepare for D20 roll icon
  - Design decision: Include a placeholder `div` with `data-card-section="quick-rolls"`.
  - Validation approach: Verify the DOM structure includes this placeholder element in the correct logical position.

## Functional Requirements Mapping

- Requirement: Prevent horizontal scrolling on smaller screens.
  - Design element: `flex-wrap` and adjusted `gap` classes.
  - Acceptance criteria reference: TBD (Specs)
  - Testability notes: Can be verified using Playwright or visual regression.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: The DOM structure must easily support future selective hiding of groups.
  - Design element: `data-card-section` attributes.
  - Acceptance criteria reference: TBD (Specs)
  - Testability notes: Verify the presence of attributes in unit/integration tests using RTL.

## Risks / Trade-offs

- Risk/trade-off: Visual layout breaking on standard desktop views due to extra DOM wrappers.
  - Impact: Low (Tailwind utility classes are explicit).
  - Mitigation: Match the existing flex alignment (`items-center`, `gap-4`, etc.) on the new wrappers.

## Rollback / Mitigation

- Rollback trigger: Significant visual regression on the main combat screen.
- Rollback steps: Revert the PR.
- Data migration considerations: None.
- Verification after rollback: Verify combat screen looks normal.

## Operational Blocking Policy

- If CI checks fail: Fix them. Do not merge.
- If security checks fail: N/A (UI only).
- If required reviews are blocked/stale: Ping code owners after 24 hours.
- Escalation path and timeout: N/A.

## Open Questions

- None.
