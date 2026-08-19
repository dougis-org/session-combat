## Purpose

Provide a single, centralized dice-rolling utility that supports standard RPG die sizes with cryptographically secure, bias-free randomness. All callers use one shared implementation instead of ad-hoc local dice logic.

## Requirements

### Requirement: Backend supports centralized dice rolls
The system SHALL expose a single backend dice-roll operation `rollDie(sides, count = 1)` that returns the requested roll values using secure random generation.

#### Scenario: Single d20 roll returns one-value array
- **WHEN** a caller requests `rollDie(20)` without providing `count`
- **THEN** the backend returns an array containing exactly one integer between 1 and 20

#### Scenario: Multi-die roll returns each die value
- **WHEN** a caller requests `rollDie(4, 2)`
- **THEN** the backend returns an array containing exactly two integers between 1 and 4
- **AND** the array contains one entry per die rolled

#### Scenario: Supported die sizes are accepted
- **WHEN** a caller requests `rollDie` with sides of 4, 6, 8, 10, 12, 20, or 100
- **THEN** the backend accepts the request and returns values within the expected range for that die size

### Requirement: Roll contract is array only
The backend SHALL return an array for every successful dice roll request, including requests where `count = 1`.

#### Scenario: One die still returns an array
- **WHEN** a caller requests `rollDie(6, 1)`
- **THEN** the backend returns a one-element array rather than a scalar value

#### Scenario: Default count is one
- **WHEN** a caller omits the `count` argument
- **THEN** the backend behaves as though `count = 1`

### Requirement: Dice rolls remain unbiased and validated
The backend SHALL use secure randomness with rejection sampling and SHALL reject invalid dice parameters.

#### Scenario: Rejection sampling prevents modulo bias
- **WHEN** the backend generates dice results for a supported die size
- **THEN** each face has an equal probability of being returned within the limits of the secure random generator

#### Scenario: Invalid die size is rejected
- **WHEN** a caller requests a die size that is not one of the supported values
- **THEN** the backend rejects the request with a validation error

#### Scenario: Invalid count is rejected
- **WHEN** a caller requests a count that is less than 1 or not an integer
- **THEN** the backend rejects the request with a validation error

### Requirement: Legacy d20-only helper is removed from the public dice API
The system SHALL not require callers to use a separate d20-only helper when the centralized dice operation is available.

#### Scenario: Current consumers use the centralized operation
- **WHEN** the combat code or any other current caller needs a d20 roll
- **THEN** it uses the centralized `rollDie(20, count)` operation instead of a dedicated `rollD20` path

### Requirement: Backend supports multi-group dice-pool rolls

The system SHALL expose a backend dice-pool operation `rollDicePool(groups)` that accepts an array of `{ sides: number; count: number }` groups and returns a single flat array of `{ sides: number; value: number }` results — one entry per individual die across all groups, preserving each result's source die size and the supplied group order.

#### Scenario: Single-group pool returns tagged results
- **WHEN** a caller requests `rollDicePool([{ sides: 6, count: 2 }])`
- **THEN** the backend returns an array of exactly two entries, each `{ sides: 6, value: <1-6> }`

#### Scenario: Mixed-group pool returns results tagged by their own group's sides
- **WHEN** a caller requests `rollDicePool([{ sides: 6, count: 2 }, { sides: 8, count: 2 }])`
- **THEN** the backend returns an array of exactly four entries: two with `sides: 6` and a `value` between 1 and 6, and two with `sides: 8` and a `value` between 1 and 8
- **AND** the entries appear in the same group order the groups were supplied in

#### Scenario: Empty group list returns an empty array
- **WHEN** a caller requests `rollDicePool([])`
- **THEN** the backend returns an empty array without error

### Requirement: Dice-pool rolls reuse the same secure randomness and validation as single-die rolls

The system SHALL validate every group's `sides` against the same supported die sizes as `rollDie`, and SHALL use the same rejection-sampled secure random generation for each individual die. Validation covers all groups before any dice are rolled — an invalid group anywhere in the request rejects the whole call.

#### Scenario: Unsupported die size in any group is rejected
- **WHEN** a caller requests `rollDicePool([{ sides: 6, count: 1 }, { sides: 7, count: 1 }])`
- **THEN** the backend rejects the request with a validation error and rolls no dice from any group

#### Scenario: Invalid count in any group is rejected
- **WHEN** a caller requests `rollDicePool([{ sides: 6, count: 0 }])`
- **THEN** the backend rejects the request with a validation error

#### Scenario: Each die within a pool uses unbiased secure randomness
- **WHEN** the backend generates results for any group within a pool
- **THEN** each face of that group's die size has an equal probability of being returned, using the same rejection-sampling approach `rollDie` uses
