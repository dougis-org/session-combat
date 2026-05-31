## GitHub Issues

- #62

## Why

- Problem statement: `CombatInfoIcon` has a test file with 6 passing RTL tests, but roughly half the acceptance criteria from issue #62 remain uncovered — specifically the two-column layout, alive-count logic in headers, ×N grouping, status-condition display, the alive/dead delimiter, strikethrough styling, "None" fallback text, independent column behaviour, and the empty-state edge case.
- Why now: The RTL infrastructure (jest-dom, jsdom, @testing-library/react) is already set up. The cost of adding these tests is low and the risk of regression in this component is meaningful as combat logic evolves.
- Business/user impact: Without these tests, regressions in the tooltip's grouping and display logic will go undetected until manual QA.

## Problem Space

- Current behavior: Six tests cover icon presence, tooltip show/hide on hover, and basic alive/dead combatant display. None of the structural, grouping, or edge-case criteria are tested.
- Desired behavior: Full coverage of all acceptance criteria listed in issue #62 — rendering, count logic, grouping & display, and edge cases.
- Constraints: Tests must live alongside the existing 6 tests in `tests/unit/components/CombatInfoIcon.test.tsx`. No new test infrastructure is needed.
- Assumptions: The component already implements all described behaviour; we are only adding missing test coverage, not changing the component.
- Edge cases considered: empty combatant list, all-dead column (should show "None" for alive section), multiple combatants sharing a name (×N), combatants with active conditions.

## Scope

### In Scope

- New `describe` blocks / `it` cases appended to `tests/unit/components/CombatInfoIcon.test.tsx`
- Coverage of: two-column headings, alive-count headers, ×N name grouping, status conditions with durations, alive/dead delimiter, strikethrough on dead, "None" text, independent column sections, empty-state render

### Out of Scope

- Changes to `CombatInfoIcon.tsx` component implementation
- New test infrastructure or configuration
- Tests for any other component

## What Changes

- `tests/unit/components/CombatInfoIcon.test.tsx` — new test cases added to existing file

## Risks

- Risk: Component implementation does not match the acceptance criteria (e.g., "None" text or ×N grouping not actually rendered).
  - Impact: Tests will fail and surface a real gap in the component.
  - Mitigation: Read `lib/components/CombatInfoIcon.tsx` carefully before writing assertions; match selectors to actual rendered output.

## Open Questions

No unresolved ambiguity exists. The component file, existing tests, and issue #62 acceptance criteria together provide sufficient specification.

## Non-Goals

- Refactoring or improving the component itself
- Adding snapshot tests
- Adding tests for any related component (e.g., `ActiveCombatView`)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
