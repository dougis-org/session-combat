## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-19-multi-dice-pool-popout/design.md) document, not a replacement.

### Requirement: ADDED Backend supports multi-group dice-pool rolls

The system SHALL expose a backend dice-pool operation `rollDicePool(groups)` that accepts an array of `{ sides: number; count: number }` groups and returns a single flat array of `{ sides: number; value: number }` results — one entry per individual die across all groups, preserving each result's source die size.

#### Scenario: Single-group pool returns tagged results

- **Given** a caller requests `rollDicePool([{ sides: 6, count: 2 }])`
- **Then** the backend returns an array of exactly two entries, each `{ sides: 6, value: <1-6> }`

#### Scenario: Mixed-group pool returns results tagged by their own group's sides

- **Given** a caller requests `rollDicePool([{ sides: 6, count: 2 }, { sides: 8, count: 2 }])`
- **Then** the backend returns an array of exactly four entries: two with `sides: 6` and a `value` between 1 and 6, and two with `sides: 8` and a `value` between 1 and 8
- **AND** the entries appear in the same group order the groups were supplied in

#### Scenario: Empty group list returns an empty array

- **Given** a caller requests `rollDicePool([])`
- **Then** the backend returns an empty array without error

### Requirement: Dice-pool rolls reuse the same secure randomness and validation as single-die rolls

The system SHALL validate every group's `sides` against the same supported die sizes as `rollDie`, and SHALL use the same rejection-sampled secure random generation for each individual die.

#### Scenario: Unsupported die size in any group is rejected

- **Given** a caller requests `rollDicePool([{ sides: 6, count: 1 }, { sides: 7, count: 1 }])`
- **Then** the backend rejects the request with a validation error and rolls no dice from any group

#### Scenario: Invalid count in any group is rejected

- **Given** a caller requests `rollDicePool([{ sides: 6, count: 0 }])`
- **Then** the backend rejects the request with a validation error

#### Scenario: Each die within a pool uses unbiased secure randomness

- **Given** the backend generates results for any group within a pool
- **Then** each face of that group's die size has an equal probability of being returned, using the same rejection-sampling approach `rollDie` uses

## MODIFIED Requirements

None. `rollDie(sides, count = 1): number[]` and its existing requirements ("Backend supports centralized dice rolls", "Roll contract is array only", "Dice rolls remain unbiased and validated", "Legacy d20-only helper is removed from the public dice API") are unchanged by this capability addition. Existing callers (`InitiativeEntry`, `lib/utils/combat.ts`) continue to use `rollDie` unmodified.

## REMOVED Requirements

None.

## Traceability

- Proposal element "New multi-group roll operation returning `{sides, value}[]`" → Requirement: ADDED Backend supports multi-group dice-pool rolls
- Design decision 1 (`rollDicePool` added alongside `rollDie`, reusing `rollOneDie`) → Requirement: ADDED Backend supports multi-group dice-pool rolls; Requirement: Dice-pool rolls reuse the same secure randomness and validation
- Requirements → Tasks: see `tasks.md`, task for `lib/utils/dice.ts` changes and `tests/unit/lib/dice.test.ts` extension

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Partial-group failure does not roll any dice

- **Given** a `rollDicePool` request contains one valid group and one group with an unsupported die size
- **When** the request is processed
- **Then** validation fails before any random values are generated for any group (no partial roll state is produced)

### Requirement: Security

No new input surface: `rollDicePool`'s `groups` parameter is validated identically to `rollDie`'s existing `sides`/`count` parameters (see functional scenarios "Unsupported die size in any group is rejected", "Invalid count in any group is rejected"). No distinct security scenario is needed.
