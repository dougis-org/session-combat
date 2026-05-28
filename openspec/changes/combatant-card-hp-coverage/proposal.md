## GitHub Issues

- #256

## Why

- Problem statement: `CombatantCard.tsx` has 53.5% statement / 36.7% branch / 45.5% function coverage. The damage-application logic (resistance, immunity, vulnerability, temp HP drain) was the subject of a full OpenSpec change; UI-layer bugs in prop threading or state updates are currently undetectable by the test suite.
- Why now: RTL infrastructure (#254) closed today — the prerequisite is met and the issue is unblocked.
- Business/user impact: Silent regressions in HP and damage display are the highest-risk failure mode in the core combat flow. Every combat session depends on this component.

## Problem Space

- Current behavior: Lines 518–735 of `CombatantCard.tsx` are untested. The existing 486-line test file uses the old `createRoot`/`act`/`container.querySelector` pattern and covers modifier badges, the effects panel, and undo — not HP display or damage application.
- Desired behavior: Branch coverage for `CombatantCard.tsx` reaches ≥65%. All uncovered lines in the HP bar, damage buttons, temp HP logic, and conditions panel are exercised with RTL tests.
- Constraints: New tests must use `@testing-library/react` + `userEvent` (RTL). The existing test file must not be modified. Tests must pass in CI.
- Assumptions: `calcApplyDamage` and `calcApplyDamageWithType` are already unit-tested at the logic level; we are testing the UI layer (prop threading, state updates, rendered output).
- Edge cases considered: immunity (zero damage, no history entry), vulnerability (double damage), temp HP absorbing partial damage, temp HP = 0 edge, HP exactly 0 triggering dead state.

## Scope

### In Scope

- New file `tests/unit/components/CombatantCard.hp.test.tsx` with RTL tests
- HP bar width via `data-testid="health-bar"` inline style
- Dead state via ☠️ emoji appearing in `<h3>` when `hp <= 0`
- Damage application: normal, resistance (half), immunity (zero), vulnerability (double)
- Temp HP draining before real HP, with spillover
- Condition display (count button) and individual condition removal calling `onUpdate`

### In Scope (expanded for ≥65% branch coverage)

- Additional RTL tests covering initiative roll display (rolled/manual/advantage), set temp HP, healing, active combatant (onNextTurn), notes, legendary action badge, and targeting UI — all added because the T1–T4 tests alone reached only 42.74% branch coverage, and these high-value branches were needed to cross the 65% threshold.

### Out of Scope

- Migrating existing tests in `CombatantCard.test.tsx` to RTL
- Testing `applyTypedDamage` or `calcApplyDamage` at the unit level (already covered elsewhere)
- Lair slot rendering
- Raising coverage in any other component

## What Changes

- New file: `tests/unit/components/CombatantCard.hp.test.tsx`
- No production code changes

## Risks

- Risk: jsdom doesn't apply Tailwind classes, so HP color (green/yellow/red) cannot be asserted via computed style.
  - Impact: Low — HP bar width (inline style) and dead emoji provide sufficient coverage of the color-branch logic.
  - Mitigation: Assert `data-testid="health-bar"` style.width for ratio coverage; note the limitation in a comment.
- Risk: `userEvent` async interactions may behave differently from the old `act()` + `.click()` pattern.
  - Impact: Low — RTL's `userEvent.setup()` with `await` handles this correctly.
  - Mitigation: Use `userEvent.setup()` pattern consistently; wrap renders in RTL's `render` (not the local legacy helper).

## Open Questions

No unresolved ambiguity. The component markup, test infrastructure, and coverage targets are fully understood from exploration.

## Non-Goals

- Achieving 100% coverage
- Refactoring `CombatantCard.tsx` production code
- Adding `data-testid` attributes to conditions markup (text queries are sufficient)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
