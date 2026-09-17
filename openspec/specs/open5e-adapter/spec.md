## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED open5e Adapter

The system SHALL provide a reusable adapter for fetching data from open5e API.

#### Scenario: Fetch paginated monsters

- **Given** the open5e API is available
- **When** adapter fetches /v2/creatures/
- **Then** the system SHALL handle pagination automatically
- **And** return all creatures across multiple pages

#### Scenario: Fetch paginated spells

- **Given** the open5e API is available
- **When** adapter fetches /v2/spells/
- **Then** the system SHALL handle pagination automatically
- **And** return all spells across multiple pages

#### Scenario: Handle rate limiting

- **Given** open5e API returns 429 Too Many Requests
- **When** adapter makes a request
- **Then** the system SHALL implement exponential backoff
- **And** retry up to 3 times before failing

#### Scenario: Handle API errors

- **Given** open5e API returns 500 or network failure
- **When** adapter makes a request
- **Then** the system SHALL throw an error with details
- **And** partial results already fetched SHALL be available

#### Scenario: Transform monster data

- **Given** raw open5e creature response
- **When** transformMonster is called
- **Then** the output SHALL match MonsterTemplate schema
- **And** required fields (name, level, concentration, school) SHALL be present

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

#### Scenario: Transform spell data

- **Given** raw open5e spell response
- **When** transformSpell is called
- **Then** the output SHALL match SpellTemplate schema
- **And** concentration field SHALL be correctly mapped from `concentration: true/false`

## Traceability

- Proposal element: open5e API integration for spell data
  - Requirement: open5e Adapter
- Design decision: lib/import/open5eAdapter.ts, transformMonster.ts, transformSpell.ts
  - Requirement: open5e Adapter
- Task(s): TBD in tasks.md
