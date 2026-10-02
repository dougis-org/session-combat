## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-10-02-add-banished-condition/design.md) document, not a replacement.

### Requirement: ADDED Catalog exposes a Banished condition

The system SHALL include a **Banished** entry in the default condition catalog with an SRD-style description and `removedFromPlay: true`, served by `GET /api/conditions/catalog`.

#### Scenario: Banished is listed

- **Given** the catalog has been seeded
- **When** an authenticated client requests `/api/conditions/catalog`
- **Then** the response contains an entry named "Banished" with a non-empty description and `removedFromPlay: true`

#### Scenario: Other entries are unchanged

- **Given** the catalog has been seeded
- **When** the catalog is requested
- **Then** every entry other than Banished has no `removedFromPlay` property and the catalog length is 19

### Requirement: ADDED Applied conditions carry the flag

The system SHALL copy `removedFromPlay` from the selected catalog entry onto the `StatusCondition` created by `ConditionFormModal`, and SHALL NOT set it on custom (freeform) conditions.

#### Scenario: Catalog pick copies the flag

- **Given** the condition modal has loaded the catalog
- **When** the DM selects Banished and adds it
- **Then** the submitted condition has `removedFromPlay: true`

#### Scenario: Custom condition named Banished is not flagged

- **Given** the DM chooses "Custom…"
- **When** they type "Banished" and add it
- **Then** the submitted condition has no `removedFromPlay` flag

### Requirement: ADDED Removed-from-play state is derived from conditions

The system SHALL treat a combatant as removed from play if and only if at least one of its current conditions has `removedFromPlay === true`.

#### Scenario: Set on add

- **Given** a combatant with no flagged conditions
- **When** a flagged condition is added
- **Then** `isRemovedFromPlay` returns true

#### Scenario: Cleared on removal or expiry

- **Given** a combatant whose only flagged condition has `duration: 1`
- **When** the condition is removed manually, or expires at round wrap via `processRoundEnd`
- **Then** `isRemovedFromPlay` returns false

### Requirement: ADDED Initiative skips removed-from-play combatants

The system SHALL skip any removed-from-play combatant, regardless of type, when advancing the turn, within a single bounded lap.

#### Scenario: Next turn skips a banished combatant

- **Given** combatants A, B (banished), C in initiative order with A active
- **When** the DM advances the turn
- **Then** C becomes active and B is never active

#### Scenario: Round wrap with banished combatant first

- **Given** the last combatant is active and the first is banished
- **When** the DM advances the turn
- **Then** the round increments and the next non-banished, non-downed combatant becomes active

#### Scenario: Nobody can act

- **Given** every combatant is banished or a downed monster
- **When** the DM advances the turn
- **Then** the alert "No combatants remain able to take a turn." is shown and combat state is unchanged

### Requirement: ADDED Unrolled initiative handling excludes removed-from-play combatants

The system SHALL NOT auto-open the initiative prompt for, count, or bulk-roll a removed-from-play combatant that has no `initiativeRoll`.

#### Scenario: Banished unrolled monster ignored

- **Given** an unrolled monster with a Banished condition
- **When** the combat view computes unrolled state
- **Then** the monster does not trigger the auto-open modal, is excluded from `unrolledMonsterCount`, and is not rolled by "Roll all monsters"

#### Scenario: Returns to the prompt after removal

- **Given** the same monster after Banished is removed
- **When** the combat view recomputes
- **Then** the monster is counted and prompts as an unrolled combatant

### Requirement: ADDED Targeting excludes removed-from-play combatants

The system SHALL omit removed-from-play combatants from the party and enemy target-selection lists and SHALL NOT render target chips for them, without mutating `targetIds`.

#### Scenario: Not selectable

- **Given** an open targeting panel and a banished enemy
- **When** the panel renders
- **Then** the banished enemy has no checkbox in either list

#### Scenario: Existing target hidden then restored

- **Given** combatant A already targets B
- **When** B becomes banished, and later the condition is removed
- **Then** B's chip is hidden while banished, `A.targetIds` still contains B throughout, and the chip reappears after removal

### Requirement: ADDED Target-add path uses the shared condition modal

The system SHALL let a DM add a condition to a targeted combatant through the same catalog-backed `ConditionFormModal` used on a combatant's own card, so catalog flags and descriptions apply.

#### Scenario: Banished applied to a target

- **Given** combatant A has combatant B as a target and the target action modal is open for B
- **When** the DM clicks "Add Condition", selects Banished in the shared modal, and adds it
- **Then** B has a condition named Banished with its catalog description and `removedFromPlay: true`, and B is removed from play

#### Scenario: Custom and timed conditions still work

- **Given** the shared modal opened from the target action modal
- **When** the DM enters a custom name with duration 3 and adds it
- **Then** B gains that condition with `duration: 3`, no `removedFromPlay` flag, and no other combatant changes

#### Scenario: Invalid input rejected

- **Given** the shared modal opened from the target action modal
- **When** the DM submits an empty name or an out-of-range duration
- **Then** no condition is added (same validation as the card path)

### Requirement: ADDED Removed-from-play cards are greyed

The system SHALL render a removed-from-play combatant's card greyed with a "Banished" indicator.

#### Scenario: Greyed card

- **Given** a combatant with a flagged condition
- **When** its card renders
- **Then** the card has the greyed (`opacity-50`) styling and shows the "Banished" badge; without the flag neither appears

### Requirement: ADDED Default catalog ships 19 conditions

The system SHALL ship 19 default conditions (the previous 18 plus Banished); catalog entries MAY carry the optional `removedFromPlay` flag. This supersedes the "18 entries" counts in the live `condition-catalog` spec, which are updated by hand at archive (its headers are malformed, so a MODIFIED delta cannot match them).

#### Scenario: Seed is idempotent at 19

- **Given** an empty `conditionCatalog` collection
- **When** `seedConditionCatalog` runs twice
- **Then** the collection holds 19 documents and the second run reports 0 inserted, 19 updated

## Traceability

- Proposal element -> Requirement: Banished entry + flag -> Catalog exposes / Applied conditions carry the flag; derived state -> Derived requirement; skip -> Initiative skips; unrolled -> Unrolled exclusion; targeting -> Targeting excludes; target-add path -> Target-add path uses the shared condition modal; greying -> Cards greyed; re-seed -> Default catalog ships 19 conditions.
- Design decision -> Requirement: D1 -> catalog + carry-flag; D2 -> derived; D3 -> initiative skip; D4 -> unrolled; D5 -> targeting; D6 -> greyed; D7 -> catalog/19-entry requirement.
- Requirement -> Task(s): see `tasks.md` Execution items 1-8 and `tests.md`.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Bounded advancement

- **Given** a combat where every combatant is removed from play
- **When** the turn is advanced
- **Then** the loop examines at most one lap of the combatant list and terminates (see also: "Nobody can act")

### Requirement: Security

#### Scenario: Catalog projection

- **Given** a stored catalog document with an extra unrelated field
- **When** the catalog is loaded
- **Then** only `name`, `description`, and (when true) `removedFromPlay` are returned

### Requirement: Reliability

#### Scenario: Backward compatibility

- **Given** saved combatants and catalog documents that predate the flag
- **When** turn advance, unrolled detection, targeting, and card rendering run
- **Then** behavior is identical to before this change
