## Why

Combatant conditions with a duration do not expire correctly during combat — they persist with a displayed duration of `0` instead of being removed. Players need a clear alert when a condition expires so they can act on it, and the UI should cleanly reflect the current game state.

## Problem Space

When a combatant's turn advances in combat, the duration of all conditions is decremented. The removal filter (`!cond.duration || cond.duration > 0`) has a JavaScript falsy-value bug: `!0 === true`, so a condition that reaches `duration = 0` satisfies `!cond.duration` and is **kept** rather than removed. This causes conditions to linger with a `(0 rounds)` display.

Additionally, there is no notification to the user when a condition expires, making it easy to miss the change in game state.

**In scope:**
- Fix the condition expiry filter so conditions at `duration = 0` are removed
- Show a validation alert listing which conditions expired at the end of a round
- Conditions expire at round end (when the turn index wraps back to the first combatant), consistent with the existing duration decrement behavior

**Out of scope:**
- Changing when condition duration ticks down (e.g. start vs. end of turn)
- Permanent (no-duration) conditions — these are unaffected
- Condition history or undo

## What Changes

- **Fix expiry filter**: Change the filter predicate to correctly remove conditions whose `duration` has reached `0`
- **Expiry alert**: Before advancing to the next turn, collect any conditions that will expire and display a browser-native alert listing the combatant name and condition names
- **Alert is non-blocking**: The turn still advances after the alert is dismissed

## Capabilities

### New Capabilities
- `combat-condition-expiry`: Automatic removal of timed conditions when their duration reaches zero during combat turn advancement, with a user-visible expiry alert

### Modified Capabilities
<!-- None — no existing spec covers combat condition lifecycle -->

## Impact

- **`app/combat/page.tsx`** — `nextTurn` handler (condition duration map + filter logic, plus new alert call)
- No API, database, or type changes required (`StatusCondition.duration` already exists as `number | undefined`)
- No new dependencies

## Open Questions

1. Should the alert list conditions for all combatants whose conditions expired this round, or only a subset?
   *(Resolved: alert covers all combatants whose conditions expire at round wrap — consistent with the round-end decrement scope.)*
2. Should expired conditions be removed at round end or at the start of each combatant's individual turn?
   *(Resolved: removed at round end, matching the existing duration decrement timing.)*

## Non-Goals

- Redesigning the condition duration UX (e.g. start-of-turn vs. end-of-turn semantics)
- Syncing condition expiry across networked sessions
- Toast/snackbar notifications — a simple `alert()` matches the existing app pattern

## Risks

- The fix is a one-line predicate change; risk of regression is low but adjacent condition display logic should be regression-tested
