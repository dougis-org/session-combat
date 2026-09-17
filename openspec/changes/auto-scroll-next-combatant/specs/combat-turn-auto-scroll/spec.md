## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Auto-scroll to the next active combatant on turn advance

The system SHALL, when the `combat.autoScrollToNextCombatant` preference resolves to `true`, smoothly scroll the newly-active combatant's card fully into view immediately after the DM clicks "Current Turn (done)" — and only in response to that click.

#### Scenario: DM completes a turn with auto-scroll enabled

- **Given** the auto-scroll preference is `true` and a combatant other than the last in initiative order is currently active
- **When** the DM clicks "Current Turn (done)" on the active combatant's card
- **Then** turn order advances as it does today, and the card matching the new active combatant's `data-combatant-id` is smoothly scrolled fully into view

#### Scenario: DM completes a turn with auto-scroll disabled

- **Given** the auto-scroll preference is `false`
- **When** the DM clicks "Current Turn (done)"
- **Then** turn order advances as it does today, and no scroll is triggered

### Requirement: ADDED Scroll target follows turn-selection, not list position

The system SHALL resolve the auto-scroll target as the combatant that `nextTurn` actually selects as active (skipping downed combatants and wrapping rounds), never assuming it is the next entry in DOM order.

#### Scenario: Turn advances past a downed combatant

- **Given** auto-scroll is enabled and the combatant immediately following the active one in initiative order has `hp <= 0`
- **When** the DM clicks "Current Turn (done)"
- **Then** the view scrolls to the card of the next combatant able to act (skipping the downed one), matching whichever combatant `nextTurn` actually selected

#### Scenario: Turn wraps to the start of the round

- **Given** auto-scroll is enabled and the currently active combatant is the last one able to act in the round
- **When** the DM clicks "Current Turn (done)"
- **Then** the view scrolls to the card of the first combatant able to act in the new round, even though it appears above the previously active combatant

### Requirement: ADDED Auto-scroll fires only for the explicit "done" click

The system SHALL NOT trigger the auto-scroll behavior for any other cause of the active combatant changing, including restarting the round or removing a combatant.

#### Scenario: Restarting the round does not trigger auto-scroll

- **Given** auto-scroll is enabled
- **When** the DM clicks "Restart Round" (not "Current Turn (done)")
- **Then** the active combatant may change but no scroll is triggered

#### Scenario: Removing a combatant does not trigger auto-scroll

- **Given** auto-scroll is enabled and removing a combatant causes the active combatant's index to shift
- **When** the DM removes that combatant
- **Then** no scroll is triggered

## Traceability

- Proposal element: Scroll to full newly-active card after "Current Turn (done)" -> Requirement: ADDED Auto-scroll to the next active combatant on turn advance
- Proposal element: Not directional (skip-downed / round-wrap aware) -> Requirement: ADDED Scroll target follows turn-selection, not list position
- Proposal element: Only scroll on explicit "done" click -> Requirement: ADDED Auto-scroll fires only for the explicit "done" click
- Design decision: Decision 1 (target resolution via guard-ref + simulated selection) -> Requirement: ADDED Scroll target follows turn-selection, not list position; ADDED Auto-scroll fires only for the explicit "done" click
- Design decision: Decision 2 (scrollIntoView mechanism) -> Requirement: ADDED Auto-scroll to the next active combatant on turn advance
- Requirement: ADDED Auto-scroll to the next active combatant on turn advance -> Task(s): implement scroll wrapper in ActiveCombatView, unit tests, e2e test
- Requirement: ADDED Scroll target follows turn-selection, not list position -> Task(s): unit test with downed/wrap fixtures
- Requirement: ADDED Auto-scroll fires only for the explicit "done" click -> Task(s): unit test asserting no-call on restartRound/removal

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** the DM has clicked "Current Turn (done)" in a typical combat with up to ~20 combatants
- **When** the scroll wrapper resolves the target and invokes `scrollIntoView`
- **Then** the call happens within the same render pass / next microtask (no perceptible delay, no additional network request)

### Requirement: Security

See functional scenarios above; this feature reads an existing authenticated user preference and manipulates client-side scroll position only — it introduces no new access-control surface. No distinct security scenario applies.

### Requirement: Reliability

#### Scenario: Preference unresolved falls back to default (on)

- **Given** the preferences API is unreachable or the local mirror has no stored value for `combat.autoScrollToNextCombatant`
- **When** the DM clicks "Current Turn (done)"
- **Then** the system behaves as if the preference is `true` (the schema default), and no error is thrown
