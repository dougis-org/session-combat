## GitHub Issues

- #730

## Why

- Problem statement: In active combat, when `nextTurn()` advances the
  initiative pointer, it lands on whichever combatant is next in the list
  regardless of whether that combatant can actually act. A monster at 0 HP is
  already dead (monsters never enter a death-save "dying" state — see
  `lib/combat/deathSaves.ts`), so giving it a turn is pure DM friction: click
  Next Turn, see a dead monster highlighted, click Next Turn again to get to
  someone who can actually act.
- Why now: reported directly by the primary user as issue #730; it's a small,
  well-contained fix with an already-agreed design (explored in a prior
  session, all open questions resolved).
- Business/user impact: fewer wasted clicks per combat round for the DM;
  removes a small but recurring UX papercut during every fight where a
  monster drops to 0 HP before the end of the round.

## Problem Space

- Current behavior: `nextTurn()` (`lib/hooks/useCombat.ts:349-378`)
  unconditionally increments `currentTurnIndex` by exactly one slot (wrapping
  to `0` and incrementing `currentRound` + running `processRoundEnd()` at the
  end of the list), then resets the legendary-action pool for whichever
  combatant it lands on. It never inspects HP or life state.
- Desired behavior: `nextTurn()` skips forward past any combatant that is a
  monster at 0 HP, landing on the next combatant that can actually take a
  turn. Round-end processing still fires for every wrap crossed while
  skipping, exactly as it does today for a single non-skipping step.
- Constraints:
  - Players must never be skipped, regardless of HP or `lifeState`. A player
    at 0 HP enters `lifeState: 'dying'` and must keep taking turns to roll
    death saves (`usesDeathSaves()` is player-only) — skipping them would
    silently break the death-save minigame.
  - `lair` combatants are not real creatures (always initiative 20, no
    meaningful HP) and must never be skipped by this logic.
  - `nextTurn()` is the single source of truth for whose turn it is —
    `ActiveCombatView.tsx` just highlights
    `combatState.combatants[currentTurnIndex]` and calls `nextTurn()`. No
    separate "skip turn" UI exists or is needed.
- Assumptions:
  - "0 HP" means `hp <= 0` (defensive; HP is not expected to go negative in
    stored state, but the check should not depend on that).
  - A monster's dead/alive status only needs to be evaluated at the moment
    `nextTurn()` runs — there is no need to proactively remove or flag dead
    monsters elsewhere in state.
- Edge cases considered:
  - Multiple consecutive dead monsters in initiative order: loop must skip
    all of them, not just one.
  - Wrapping past the end of the list while skipping (round wrap happening
    mid-skip): round-end processing must fire per wrap crossed, same as it
    does today for a normal single-step advance.
  - Every remaining/all combatants are dead monsters (encounter effectively
    over except for bookkeeping): must not infinite-loop; must not silently
    land on a dead monster either. Surface this to the DM instead.
  - A monster that is healed back above 0 HP after being skipped: no special
    "revival" bookkeeping needed, since the skip check reads live HP each
    time `nextTurn()` runs — it just stops being skipped once healed.

## Scope

### In Scope

- Modify `nextTurn()` in `lib/hooks/useCombat.ts` to skip monsters at 0 HP
  when advancing the turn pointer.
- Preserve existing round-end processing (`processRoundEnd`, condition
  expiry alert) and legendary-pool reset (`resetIncomingLegendaryPool`)
  semantics, applied correctly across a multi-step skip.
- Handle the all-combatants-unable-to-act edge case with a no-op + DM-facing
  alert, consistent with the existing alert pattern already used in
  `nextTurn()` for expiring conditions.
- Unit-level test coverage of the new skip behavior (single skip, multiple
  consecutive skips, skip-with-round-wrap, all-dead no-op, player-at-0-HP not
  skipped, lair-not-skipped, healed-monster resumes normal turn).

### Out of Scope

- Any UI change to `ActiveCombatView.tsx` or other components — this is
  purely a `nextTurn()` logic change; no new "skip turn" button, banner, or
  indicator is being added.
- Changing how/when a monster's HP reaches 0, or any damage/healing pipeline
  behavior (`applyHpChange.ts`, `deathSaves.ts` are untouched).
- Changing death-save behavior for players at 0 HP.
- Any change to `restartRound()` or `rollInitiative()` beyond what's implied
  by `nextTurn()`'s new behavior (neither currently needs to change).

## What Changes

- `nextTurn()` advances the turn index in a bounded loop instead of a single
  increment: it keeps stepping forward (wrapping and running round-end
  processing on each wrap, as today) until it lands on a combatant that is
  not a monster at 0 HP, or until it has examined every combatant once.
- If no combatant can take a turn (bounded loop exhausted without finding
  one), `nextTurn()` is a no-op and alerts the DM, rather than landing on an
  arbitrary/dead combatant.
- `resetIncomingLegendaryPool()` is applied only to the final landing index,
  not to combatants skipped over along the way (matches current single-step
  behavior, just generalized to a multi-step skip).

## Risks

- Risk: Off-by-one or loop-bound errors could cause `nextTurn()` to skip a
  combatant that should have gotten a turn, or to loop forever.
  - Impact: DM loses track of whose turn it is, or the app hangs.
  - Mitigation: Bound the loop strictly by `combatants.length` iterations;
    cover with unit tests for 1, 2, and "all" consecutive dead monsters, plus
    an all-dead exhaustion case.
- Risk: Round-end processing (`processRoundEnd`, condition-expiry alert) run
  multiple times within a single `nextTurn()` call if skipping crosses more
  than one wrap (e.g. an encounter with very few combatants, most of them
  dead).
  - Impact: Conditions could decrement/expire more than once per actual
    round, corrupting condition duration tracking.
  - Mitigation: This is the agreed, expected behavior (each wrap crossed
    during a skip is treated identically to today's single-wrap case) — call
    it out explicitly in `design.md` and cover it with a dedicated test so
    the behavior is intentional and pinned, not accidental.
- Risk: Skip condition (`type === 'monster' && hp <= 0`) accidentally also
  matches or mismatches `lair` combatants or players due to a loose
  condition.
  - Impact: Lair slots get skipped (they never should be, since they're
    always "actionable" for lair-action purposes) or a dying player gets
    skipped (breaks death saves).
  - Mitigation: Explicit type discrimination (`type === 'monster'`) rather
    than an HP-only check; dedicated tests for both `lair` and
    `player`-at-0-HP combatants confirming they are never skipped.

## Open Questions

None — this proposal follows directly from an explore-mode session
(`/opsx:explore` on issue #730) in which all design ambiguities (round-wrap
semantics, the all-dead edge case, and revival handling) were raised and
resolved by the requester before this proposal was written.

## Non-Goals

- No change to how a monster's HP reaches 0 or how death/downed state is
  computed for players or monsters.
- No new UI affordance for "skipped" turns — the skip is invisible to the
  end user beyond the turn pointer landing correctly.
- No change to lair-action scheduling or legendary-action pool sizing logic
  beyond preserving their existing reset-on-landing behavior.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
