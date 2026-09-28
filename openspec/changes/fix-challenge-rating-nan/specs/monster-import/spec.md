## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: MODIFIED Challenge rating parsing never produces NaN

The system SHALL parse a monster's challenge rating from an Open5E import payload such that any string input — including a fraction-form string with a non-numeric numerator or denominator — resolves to a finite number, falling back to `0` when the input cannot be parsed as a valid rating.

#### Scenario: Fraction with non-numeric numerator falls back to zero

- **Given** an Open5E creature payload with `challenge_rating: "x/2"`
- **When** `transformMonster` parses the payload
- **Then** the resulting `MonsterTemplate.challengeRating` is `0`, not `NaN`

#### Scenario: Fraction with non-numeric denominator falls back to zero

- **Given** an Open5E creature payload with `challenge_rating: "2/x"`
- **When** `transformMonster` parses the payload
- **Then** the resulting `MonsterTemplate.challengeRating` is `0`, not `NaN`

#### Scenario: Valid fraction and zero-denominator behavior unchanged

- **Given** Open5E creature payloads with `challenge_rating: "1/2"` and `challenge_rating: "1/0"`
- **When** `transformMonster` parses each payload
- **Then** the resulting `MonsterTemplate.challengeRating` is `0.5` and `0` respectively, matching pre-existing behavior

## Traceability

- Proposal element: "Add a finite-number guard on the numerator in the `"/"` branch of `parseChallengeRating`" -> Requirement: "MODIFIED Challenge rating parsing never produces NaN"
- Design decision: Decision 1 (`Number.isFinite(num)` guard) -> Requirement: "MODIFIED Challenge rating parsing never produces NaN"
- Design decision: Decision 2 (test via `transformMonster`) -> Requirement: All scenarios above, validated through `transformMonster` rather than a direct `parseChallengeRating` export
- Requirement -> Task(s): `tasks.md` task "Add finite-number guard to parseChallengeRating" and task "Add regression tests for NaN fraction cases"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No NaN propagation from import pipeline

- **Given** any string value for `challenge_rating` in an Open5E import payload, including malformed fraction strings
- **When** `transformMonster` computes `MonsterTemplate.challengeRating`
- **Then** the result is always a finite number (`Number.isFinite(monster.challengeRating)` is `true`), never `NaN`

No distinct Performance, Security, or Access-control criteria apply to this change; see functional scenarios above for the complete behavioral contract.
