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
