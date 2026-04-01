## Why

Issue #13 asks for a single central dice-rolling library so the app uses one
consistent, repeatable implementation for standard dice sizes and multi-die
rolls. Today the codebase only has a d20 helper in `lib/utils/dice.ts`, and
`app/combat/page.tsx` imports it directly for initiative rolls.

## What Changes

- Replace the d20-only helper with a single back-end `rollDie(sides, count = 1)`
  utility that can roll d4, d6, d8, d10, d12, d20, and d100 using the same
  secure randomness approach.
- Support rolling multiple dice of the same size and returning the individual
  roll values as an array only.
- Keep the randomness unbiased by preserving rejection sampling.
- Remove or refactor `rollD20` so current callers use the shared utility
  directly instead of keeping a convenience wrapper around.

## Capabilities

### New Capabilities

- `dice-rolling`: Roll standard RPG dice with secure randomness, including
  multi-die rolls that return per-die results.

### Modified Capabilities

<!-- None - this change is primarily a utility consolidation with no intended
     user-facing behavior change. -->

## Impact

- Modified file: `lib/utils/dice.ts`
- Modified file: `tests/unit/lib/dice.test.ts`
- Modified file: `app/combat/page.tsx` and any other current caller that still
  imports `rollD20`
- No API changes
- No database changes
- No auth changes

## Scope

**In scope:**
- Standard dice sizes: d4, d6, d8, d10, d12, d20, and d100
- Multi-die rolls returning an array of each die result
- A single shared dice module with `rollDie(sides, count = 1)`
- Preserving the current secure-random implementation pattern

**Out of scope:**
- Dice notation parsing such as `2d6+3`
- Damage-total helpers or automatic summing
- Advantage/disadvantage mechanics
- Exploding dice, rerolls, or other house rules
- UI changes

## Risks

- **API shape uncertainty**: The repository currently exposes a single `rollD20`
  helper, so the shared API needs to balance simplicity with future reuse.
- **Multi-die return shape**: Returning an array is the right fit for issue #13,
  but callers may still want totals later; keeping the API focused avoids
  overcommitting now.
- **Bias handling for larger dice**: The implementation should keep rejection
  sampling so all supported die sizes remain unbiased.

## Open Questions

None. The API decision is settled for this change.

## Non-Goals

- Parsing full tabletop dice expressions
- Adding persistence for roll history
- Introducing deterministic seeding for gameplay
- Expanding beyond the die sizes requested in issue #13
- Adding sum helpers or other derived roll aggregations

---
*If scope changes after approval, proposal, design, specs, and tasks should be
updated together before implementation.*