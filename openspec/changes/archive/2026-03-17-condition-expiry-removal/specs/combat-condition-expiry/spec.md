## ADDED Requirements

### Requirement: Timed conditions are removed when their duration reaches zero at round end
When a combat round completes (turn index wraps back to the first combatant), any condition whose `duration` would reach `0` after decrement SHALL be removed from the combatant's condition list and SHALL NOT appear in subsequent combat state.

#### Scenario: Condition with duration 1 expires at end of round
- **WHEN** a combatant has a condition with `duration = 1` and the last combatant's turn advances (completing the round)
- **THEN** the condition is removed from the combatant's conditions array in the saved combat state

#### Scenario: Condition with duration 2 does not expire mid-round
- **WHEN** a combatant has a condition with `duration = 2` and a round completes
- **THEN** the condition remains with `duration = 1`

#### Scenario: Condition with no duration is never removed by the expiry mechanism
- **WHEN** a combatant has a condition where `duration` is `undefined`
- **THEN** the condition persists unchanged across round advances

#### Scenario: Condition previously reaching duration 0 is removed (regression guard)
- **WHEN** the filter predicate evaluates a condition with `duration = 0`
- **THEN** the condition is removed (NOT retained due to falsy evaluation of `!0`)

### Requirement: User receives an alert when conditions expire
Before advancing to the next round, the system SHALL display a single `alert()` message listing every condition that is expiring in this round advance, identified by combatant name and condition name.

#### Scenario: Single condition expiring
- **WHEN** exactly one condition expires during a round advance (e.g., Goblin's "Poisoned" with `duration = 1`)
- **THEN** an alert is shown with text that includes the combatant name ("Goblin") and condition name ("Poisoned")

#### Scenario: Multiple conditions expiring across combatants
- **WHEN** two or more conditions expire during the same round advance
- **THEN** a single alert is shown listing all expiring condition pairs (combatant + condition name)

#### Scenario: No conditions expiring
- **WHEN** no conditions reach duration 0 during a round advance
- **THEN** no alert is displayed

#### Scenario: Turn advances mid-round (no round wrap)
- **WHEN** the turn index advances but does NOT wrap to the beginning of a new round
- **THEN** no condition duration changes occur and no alert is shown
