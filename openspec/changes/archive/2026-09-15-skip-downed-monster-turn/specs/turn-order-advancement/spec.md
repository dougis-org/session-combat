## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Skip downed monsters when advancing the turn

The system SHALL, when advancing to the next turn, skip any combatant whose
`type` is `"monster"` and whose `hp` is `0` or less, and land on the next
combatant able to act, rather than stopping the turn pointer on a downed
monster.

#### Scenario: Monster at 0 HP is skipped

- **Given** an active combat with combatants `[A (player, 10 hp), B
  (monster, 0 hp), C (player, 8 hp)]` and the current turn is `A`
- **When** the DM advances to the next turn
- **Then** the turn pointer lands on `C`, not `B`

#### Scenario: Consecutive downed monsters are all skipped

- **Given** an active combat with combatants `[A (player), B (monster, 0
  hp), C (monster, 0 hp), D (player)]` and the current turn is `A`
- **When** the DM advances to the next turn
- **Then** the turn pointer lands on `D`, and neither `B` nor `C` is ever
  set as the current turn

### Requirement: ADDED Dying players are never skipped

The system SHALL always stop the turn pointer on a player combatant when it
is that player's turn, regardless of the player's `hp` or `lifeState`
(including `"dying"`), so that death-saving-throw turns are never bypassed.

#### Scenario: Player at 0 HP keeps their turn

- **Given** an active combat with combatants `[A (player), B (player, 0 hp,
  lifeState: "dying")]` and the current turn is `A`
- **When** the DM advances to the next turn
- **Then** the turn pointer lands on `B`

### Requirement: ADDED Lair combatants are never skipped

The system SHALL never apply the downed-monster skip to combatants of type
`"lair"`, since lair slots are not creatures and do not have a meaningful HP
state.

#### Scenario: Lair combatant is never skipped

- **Given** an active combat with combatants `[A (player), L (lair), B
  (player)]` and the current turn is `A`
- **When** the DM advances to the next turn
- **Then** the turn pointer lands on `L`

### Requirement: ADDED Round-end processing fires once per wrap crossed while skipping

The system SHALL run round-end processing (condition-duration decrement,
expiring-condition collection, and `currentRound` increment) exactly once
for each time the turn pointer wraps past the end of the initiative list
while skipping downed monsters, identical to the existing single-step
behavior.

#### Scenario: Skip crosses the round wrap

- **Given** an active combat on round `1` with combatants `[A (player), B
  (monster, 0 hp)]` and the current turn is `A`
- **When** the DM advances to the next turn
- **Then** the turn pointer wraps past `B` and lands back on `A`,
  `currentRound` becomes `2`, and round-end processing (condition
  decrement/expiry) runs exactly once

Note: because the skip loop is bounded at one full lap of the initiative
list (at most `combatants.length` steps), it can cross the end-of-list wrap
boundary at most once per `nextTurn()` call — a full lap visits every
position exactly once, so a second wrap within the same call is not
possible.

### Requirement: ADDED No combatant can act is a no-op with a DM-facing alert

The system SHALL, when every combatant reachable within one full pass of
the initiative list is either a downed monster or otherwise ineligible,
leave `currentTurnIndex`, `currentRound`, and all combatant state unchanged,
and SHALL notify the DM (e.g. via an alert) that no combatant remains able
to take a turn.

#### Scenario: Every remaining combatant is a downed monster

- **Given** an active combat with combatants `[A (monster, 0 hp), B
  (monster, 0 hp)]` and the current turn is `A`
- **When** the DM advances to the next turn
- **Then** `currentTurnIndex`, `currentRound`, and both combatants' state
  are unchanged from before the action, and the DM is shown an alert
  stating no combatant can act

### Requirement: ADDED Legendary-action pool reset targets only the final landing combatant

The system SHALL apply the legendary-action pool reset only to the
combatant the turn pointer finally lands on, not to any downed monster
skipped over along the way.

#### Scenario: Skipped monster's legendary pool is untouched

- **Given** an active combat with combatants `[A (player), B (monster, 0
  hp, legendaryActionsRemaining: 0), C (monster, legendaryActionCount: 3,
  legendaryActionsRemaining: 1)]` and the current turn is `A`
- **When** the DM advances to the next turn
- **Then** the turn pointer lands on `C`, `C.legendaryActionsRemaining` is
  reset to `C.legendaryActionCount`, and `B.legendaryActionsRemaining`
  remains `0`

### Requirement: ADDED Turn advancement selects the next combatant able to act

The system SHALL, when advancing the turn, select the next combatant in
initiative order that is able to act (i.e. not a downed monster), instead
of unconditionally selecting the next combatant in list order regardless of
its ability to act.

#### Scenario: Healed monster resumes its normal turn

- **Given** a monster `M` was skipped in a previous round while at `0` hp,
  and has since been healed to `5` hp before its next natural turn comes
  up
- **When** the DM advances the turn to the point where `M` is next in
  initiative order
- **Then** the turn pointer lands on `M` (it is no longer skipped)

## Traceability

- Proposal element: skip condition `type === 'monster' && hp <= 0`, never
  skip players/lair -> Requirement: "ADDED Skip downed monsters when
  advancing the turn", "ADDED Dying players are never skipped", "ADDED Lair
  combatants are never skipped".
- Proposal element: bounded multi-skip loop; round-end processing fires per
  wrap crossed -> Requirement: "ADDED Round-end processing fires once per
  wrap crossed while skipping".
- Proposal element: all-dead edge case is a no-op + DM alert -> Requirement:
  "ADDED No combatant can act is a no-op with a DM-facing alert".
- Proposal element: `resetIncomingLegendaryPool` applies only to the final
  landing index -> Requirement: "ADDED Legendary-action pool reset targets
  only the final landing combatant".
- Proposal element: no special revival handling -> Requirement: "ADDED
  Turn advancement selects the next combatant able to act" (scenario
  "Healed monster resumes its normal turn").
- Design decision 1 (skip predicate) -> Requirement: "ADDED Skip downed
  monsters when advancing the turn", "ADDED Dying players are never
  skipped", "ADDED Lair combatants are never skipped".
- Design decision 2 (bounded loop, reused round-end/legendary-pool calls)
  -> Requirement: "ADDED Round-end processing fires once per wrap crossed
  while skipping", "ADDED Legendary-action pool reset targets only the
  final landing combatant".
- Design decision 3 (all-dead no-op + alert) -> Requirement: "ADDED No
  combatant can act is a no-op with a DM-facing alert".
- Requirement -> Task(s): see `tasks.md` (T1-T5) for the implementation and
  test tasks covering each requirement above.

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Turn advancement never loops unboundedly

- **Given** an active combat where every combatant is a downed monster (or
  the combatants list is otherwise exhausted of eligible combatants)
- **When** the DM advances the turn
- **Then** the operation completes synchronously within a single bounded
  pass over the combatants list (at most `combatants.length` iterations)
  and does not hang or recurse unboundedly

(No additional Performance or Security NFAC scenarios apply: this change
touches no network, persistence, or access-control boundary, and involves
no distinguishable latency budget beyond the existing synchronous
in-memory `nextTurn()` call already covered by the functional scenarios
above.)
