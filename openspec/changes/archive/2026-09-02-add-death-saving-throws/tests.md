---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-death-saving-throws` change. All work follows a strict TDD process: write a failing test, write the simplest code to pass it, then refactor.

Test file targets:

- `tests/unit/combat/deathSaves.test.ts` — pure state-machine logic (T2/T3, T4)
- `tests/unit/components/CombatantCard.deathSaves.test.tsx` — HP-wiring integration (T5–T7)
- `tests/unit/components/DeathSaveTracker.test.tsx` — tracker sub-component (T8/T9)
- `tests/unit/components/ActiveCombatView.deathSaves.test.tsx` — initiative-list styling (T11/T12)

Commands: `npm run test:unit -- <pattern>`, `npm run typecheck`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** that captures the task's requirements; run it and confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Task T1 — `CombatantState` fields (spec: Reliability / legacy state)

- [ ] `npm run typecheck` passes with `deathSaves?` and `lifeState?` added
- [ ] A `CombatantState` literal without `deathSaves`/`lifeState` still type-checks (fields optional)

### Task T2/T3 — `lib/combat/deathSaves.ts` pure logic

**`usesDeathSaves` (spec: Non-player combatants do not make death saves)**

- [ ] returns `true` for `type: 'player'`
- [ ] returns `false` for `type: 'monster'`
- [ ] returns `false` for `type: 'lair'`

**`enterDying` (spec: Player character enters the dying state at 0 HP)**

- [ ] returns `{ lifeState: 'dying', deathSaves: { successes: 0, failures: 0 } }`
- [ ] does not mutate the input combatant

**`applyDeathSaveRoll` (spec: Rolling a death save applies the correct outcome)**

- [ ] d20 = 15 with `{0,0}` → `{ successes: 1, failures: 0 }`, `lifeState` unchanged
- [ ] d20 = 10 (boundary) → success added
- [ ] d20 = 9 with `{1,0}` → `{ successes: 1, failures: 1 }`
- [ ] d20 = 2 (boundary) → failure added
- [ ] d20 = 20 with `hp: 0, {1,2}` → `{ hp: 1, lifeState: undefined, deathSaves: undefined }` and a "Nat 20 — revived at 1 HP" note flag
- [ ] d20 = 1 with `{2,0}` → `failures` becomes `2`
- [ ] third success (d20 = 15 with `{2,1}`) → `{ lifeState: 'stable', deathSaves: undefined }`
- [ ] third failure (d20 = 5 with `{2,2}`) → `{ lifeState: 'dead', deathSaves: undefined }`
- [ ] nat-1 that reaches 3 failures from `{0,1}` → `dead`, counts cleared
- [ ] reaching 3 failures resolves to `dead` even when successes are at 2

**`toggleDeathSaveSlot` (spec: Death-save slots are individually toggleable)**

- [ ] toggling success index 1 from `{1,0}` → `{2,0}`
- [ ] toggling the same slot again → back to `{1,0}`
- [ ] toggling failure index 0 from `{0,0}` → `{0,1}`
- [ ] toggling success index 2 from `{2,0}` → `lifeState: 'stable'`, counts cleared
- [ ] toggling failure index 2 from `{0,2}` → `lifeState: 'dead'`, counts cleared

**`applyDamageWhileDowned` (spec: Damage to a downed character adds failures; critical or massive damage is instant death)**

- [ ] `dying`, `{0,0}`, damage 5, `critical: false`, `maxHp: 20` → `{ deathSaves: { successes: 0, failures: 1 }, lifeState: 'dying' }`
- [ ] `dying`, damage 5, `critical: true` → `lifeState: 'dead'`, counts cleared
- [ ] `dying`, damage 20, `maxHp: 20`, `critical: false` → `lifeState: 'dead'` (massive damage)
- [ ] `dying`, damage 19, `maxHp: 20` → one failure, still `dying`
- [ ] `stable`, damage 5, `critical: false`, `maxHp: 20` → `lifeState: 'dying'`, `deathSaves: { successes: 0, failures: 1 }`
- [ ] second failure from an existing `{0,1}` → `{0,2}`, still `dying`

**`clearDeathState` (spec: Healing a downed character above 0 HP clears death-save state)**

- [ ] from `dying` / `{1,2}` → `{ lifeState: undefined, deathSaves: undefined }`
- [ ] from `stable` → cleared
- [ ] from `dead` → cleared

**Legacy / undefined handling (spec: Reliability — Combat state without death-save fields)**

- [ ] `applyDamageWhileDowned` / display helpers accept a combatant with no `lifeState`/`deathSaves` without throwing
- [ ] a combatant with `lifeState: undefined` is reported as "active"

### Task T4 — `lifeStateDisplay` helper (spec: Initiative list reflects life state; MODIFIED zero-HP indicator)

- [ ] `lifeState: undefined`, player, `hp > 0` → `{ badge: none, greyed: false, showTracker: false }`
- [ ] `lifeState: 'dying'` → `{ badge: 'Dying', greyed: false, showTracker: true }`
- [ ] `lifeState: 'stable'` → `{ badge: 'Stable', greyed: true, showTracker: false }`
- [ ] `lifeState: 'dead'` → `{ badge: 'Dead', greyed: true, showTracker: false }`
- [ ] `type: 'monster'`, `hp: 0`, no `lifeState` → `{ badge: '☠️', greyed: ..., showTracker: false }` (existing behavior preserved)
- [ ] `type: 'player'`, `hp: 0`, `lifeState: 'stable'` → shows "Stable", not a bare `☠️`

### Task T5/T6/T7 — `adjustHp` wiring in `CombatantCard`

- [ ] player `hp: 4` takes 4 damage → `onUpdate` called with `hp: 0`, `lifeState: 'dying'`, `deathSaves: { successes: 0, failures: 0 }` (spec: Player character enters the dying state at 0 HP)
- [ ] monster `hp: 3` takes 3 damage → `onUpdate` called with `hp: 0` and NO `lifeState`/`deathSaves` (spec: Monster reaches 0 HP)
- [ ] player already `dying` at `hp: 0` takes 5 non-critical damage (< maxHp) → `onUpdate` adds one failure, `lifeState` stays `dying` (spec: Downed character takes ordinary damage)
- [ ] player `dying` at `hp: 0`, `maxHp: 20`, takes 20 damage → `onUpdate` sets `lifeState: 'dead'`, `deathSaves` cleared (spec: Massive damage is instant death)
- [ ] player `stable` at `hp: 0` takes 5 damage → `onUpdate` sets `lifeState: 'dying'`, `deathSaves: { successes: 0, failures: 1 }` (spec: Stable character takes damage and returns to dying)
- [ ] player `dying` / `{1,2}` healed by 6 → `onUpdate` called with `hp: 6`, `lifeState: undefined`, `deathSaves: undefined` (spec: Downed character is healed above 0)
- [ ] player `dying` at `hp: 0` healed by 0 (or clamped, still 0) → no `lifeState`/`deathSaves` change (spec: Healing to exactly 0 does not revive)
- [ ] T7 note: if the damage UI has a critical-hit control, `critical` flows into `applyDamageWhileDowned`; test crit → dead. If not, document and test only the `damage >= maxHp` path.

### Task T8/T9 — `DeathSaveTracker` component

- [ ] renders 3 success slots and 3 failure slots reflecting `deathSaves: { successes: 1, failures: 2 }` (1 success filled, 2 failures filled) (spec: Player character enters the dying state at 0 HP)
- [ ] clicking success slot index 1 calls `onToggle('success', 1)` (spec: DM toggles a death-save slot manually)
- [ ] clicking failure slot index 0 calls `onToggle('failure', 0)`
- [ ] "Roll death save" button calls the roll handler; handler uses `rollDie(20)` (spy asserts `rollDie` called with `20`, `Math.random` never called) (spec: NFAC Security — unbiased secure generator)
- [ ] after a roll, the rolled d20 value is displayed inline
- [ ] rendering the tracker does not import/init a dice 3D engine module (static-import assertion / no `dice-box` in the render path) (spec: NFAC Performance — no dice engine load)
- [ ] tracker is shown for a player at `hp <= 0` and not shown for a monster at `hp <= 0` (spec: Monster reaches 0 HP)
- [ ] tracker is not shown once `lifeState` is `stable` or `dead` (spec: Three successes stabilize, three failures kill)

### Task T10 — zero-HP indicator sites in `CombatantCard`

- [ ] card header for a player with `lifeState: 'stable'`, `hp: 0` shows "Stable" (not bare `☠️`) (spec: MODIFIED — Player card indicator follows life state)
- [ ] card header for a monster with `hp: 0`, no `lifeState` shows `☠️` (spec: MODIFIED — Non-player card indicator unchanged)
- [ ] target list entry reflects the same life-state-driven indicator

### Task T11/T12 — initiative-list styling in `ActiveCombatView`

- [ ] combat with active + dying + stable + dead players: active renders normal/no badge; dying renders normal + "Dying" + tracker; stable renders greyed + "Stable" + no tracker; dead renders greyed + "Dead" + no tracker (spec: Initiative list reflects life state)
- [ ] advancing turns (`nextTurn`) still stops on the stable player's turn and the dead player's turn (no skip logic added) (spec: Initiative list reflects life state — not skipped)
- [ ] `nextTurn` in `lib/hooks/useCombat.ts` is unchanged (no life-state branch) — assert via test or code review checklist

### Task T13 — follow-up house-rules issue

- [ ] Follow-up GitHub issue exists, references #92, and its number is recorded in `tasks.md`
- [ ] `proposal.md` / `design.md` note that the nat-20 rule is hard-coded here pending that issue

### Cross-cutting validation

- [ ] `openspec validate add-death-saving-throws --strict` passes
- [ ] full `npm run test:unit` green
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` all clean
- [ ] `npm run test:regression` green (no combat regression)
- [ ] every scenario in `specs/death-saving-throws/spec.md` traces to at least one checked test case above
