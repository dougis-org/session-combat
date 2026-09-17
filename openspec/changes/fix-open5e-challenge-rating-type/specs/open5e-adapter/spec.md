## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: MODIFIED Transform monster data

The system SHALL accept `challenge_rating` as either a `number` or a fraction `string` (e.g. `"1/2"`) on the raw open5e creature payload, and SHALL always produce a numeric `challengeRating` on the output `MonsterTemplate`.

#### Scenario: Transform monster data with numeric challenge rating

- **Given** raw open5e creature response with `challenge_rating: 10`
- **When** transformMonster is called
- **Then** the output `MonsterTemplate.challengeRating` SHALL equal `10`

#### Scenario: Transform monster data with fraction-string challenge rating

- **Given** raw open5e creature response with `challenge_rating: "1/2"`
- **When** transformMonster is called
- **Then** the output `MonsterTemplate.challengeRating` SHALL equal `0.5`

#### Scenario: Transform monster data with additional fraction-string challenge ratings

- **Given** raw open5e creature response with `challenge_rating: "1/4"` or `challenge_rating: "1/8"`
- **When** transformMonster is called
- **Then** the output `MonsterTemplate.challengeRating` SHALL equal `0.25` or `0.125` respectively

#### Scenario: Transform monster data with zero-denominator fraction challenge rating

- **Given** raw open5e creature response with `challenge_rating: "1/0"`
- **When** transformMonster is called
- **Then** the output `MonsterTemplate.challengeRating` SHALL equal `0`
- **And** the transform SHALL NOT throw or produce `NaN`/`Infinity`

#### Scenario: Transform monster data with non-numeric challenge rating string

- **Given** raw open5e creature response with `challenge_rating: "CR5"` (or an empty string)
- **When** transformMonster is called
- **Then** the output `MonsterTemplate.challengeRating` SHALL equal `0`

#### Scenario: Transform monster data with bare numeric-string challenge rating

- **Given** raw open5e creature response with `challenge_rating: "5"`
- **When** transformMonster is called
- **Then** the output `MonsterTemplate.challengeRating` SHALL equal `5`

## Traceability

- Proposal element: Widen `Open5ECreature.challenge_rating` type to `number | string`
  - Requirement: MODIFIED Transform monster data
- Proposal element: Add unit test coverage for fraction-string and fallback branches of `parseChallengeRating`
  - Requirement: MODIFIED Transform monster data (all scenarios above)
- Design decision: Decision 1 (type widening), Decision 2 (test coverage via `transformMonster`)
  - Requirement: MODIFIED Transform monster data
- Task(s): TBD in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No silent misclassification of low-CR creatures on import

- **Given** the open5e API returns a fraction-string `challenge_rating` for a sub-CR-1 creature
- **When** the creature is imported via `transformMonster`
- **Then** the resulting `MonsterTemplate.challengeRating` SHALL be a correctly-parsed number, verified by automated test coverage rather than relying on untested defensive code

See functional scenarios above for the exhaustive input/output cases covered.
