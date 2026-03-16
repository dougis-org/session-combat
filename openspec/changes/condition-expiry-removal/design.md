## Context

Combat turn advancement in `app/combat/page.tsx` (`nextTurn`) handles condition duration at round boundaries: when the turn index wraps back to 0 (start of a new round), each combatant's timed conditions have their duration decremented by 1.

**Current broken behavior:**
- The filter predicate `!cond.duration || cond.duration > 0` is logically incorrect: in JavaScript `!0 === true`, so conditions that reach `duration = 0` satisfy `!cond.duration` and are **retained** rather than removed.
- No user alert is fired when conditions expire.

The `StatusCondition` type (`lib/types.ts`) already carries an optional `duration?: number` (rounds remaining). No type or data model changes are needed.

## Goals / Non-Goals

**Goals:**
- Correctly remove conditions whose `duration` reaches `0` after the decrement
- Display a browser `alert()` listing every condition that is about to be removed so the player is aware
- Keep the alert non-blocking (turn advances after dismissal)

**Non-Goals:**
- Changing *when* duration ticks (remains: once per full round, at round wrap)
- Adding a toast/snackbar notification system
- Persisting condition expiry history
- Per-turn (not per-round) condition semantics

## Decisions

### D1: Fix filter predicate — use explicit `undefined`/`null` check
**Decision**: Replace `!cond.duration || cond.duration > 0` with `cond.duration == null || cond.duration > 0`.

**Rationale**: `cond.duration == null` correctly handles both `undefined` and `null` (conditions with no expiry), while explicitly excluding `0` from the "keep" branch. This is the minimal, targeted fix with no side-effects on surrounding logic.

**Alternatives considered:**
- `typeof cond.duration === 'undefined' || cond.duration > 0`: verbose but equivalent; rejected for brevity.
- Moving to a separate helper function: overkill for a one-liner predicate.

**Proposal mapping**: Fixes "Combatant conditions do not remove when there number of rounds have expired" from the issue.

### D2: Collect expiring conditions before mutation, then alert
**Decision**: Before the `.map()` + `.filter()` pass, collect a list of `{ combatantName, conditionName }` tuples for all conditions where `cond.duration !== undefined && cond.duration - 1 <= 0`. Then fire a single `alert()` with all expiring conditions before calling `saveCombatState`.

**Rationale**:
- A single alert for the batch is less disruptive than one per condition.
- `alert()` matches the existing app interaction pattern (see `addCondition` prompt calls).
- Collecting *before* the mutation avoids needing to diff old vs. new state.

**Alternatives considered:**
- Toast/notification component: requires new UI infrastructure; out of scope.
- Alert per combatant: creates multiple blocking dialogs; rejected.

**Proposal mapping**: Implements "validation alert" from the issue.

### D3: Scope of alert — all combatants in the round, not just current
**Decision**: The alert covers all combatants whose conditions expire in this round (the entire `updatedCombatants` scan), not just the combatant whose turn was just advanced.

**Rationale**: Conditions are decremented for all combatants at round wrap simultaneously. Filtering to only "the current combatant" would be inconsistent with the decrement logic. If the product evolves to per-turn semantics, this decision can be revisited.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `alert()` blocks the browser UI thread | Accepted — matches existing app pattern; a future enhancement could replace it with a non-blocking toast |
| Tests that call `nextTurn` may not account for `alert()` calls | Mock `window.alert` in relevant unit/integration tests |
| Edge case: condition with `duration = 1` ticks to `0` and is removed — but player may not have seen the `(1 rounds)` display | Alert on expiry is the notification mechanism; this is by design |

## Rollback / Mitigation

The change is isolated to two lines in `nextTurn` in `app/combat/page.tsx`. Rolling back is a one-line revert. No migrations or data changes are required.

## Open Questions

1. Should conditions with `duration` explicitly set to `0` on creation (i.e., never ticking) be treated as permanent or immediately expired? *(Current assumption: `0` on creation = already expired, consistent with the fixed filter.)*
