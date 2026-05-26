## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED `createTestEmail` in `auth.test.helpers.ts` is the sole email generator

The system SHALL generate all test email addresses via `createTestEmail` from `tests/integration/auth.test.helpers.ts`. No other file in `tests/integration/` SHALL contain inline email construction using `Date.now()` alone (without a random component).

#### Scenario: Collision-safe email in parallel workers

- **Given** two Jest workers run simultaneously with the same `prefix`
- **When** each calls `createTestEmail(prefix)`
- **Then** the probability of collision is negligible (timestamp ms + 9-char base-36 random suffix)

#### Scenario: `register.test.ts` special-email test uses safe generation

- **Given** `register.test.ts` tests special-character email formats
- **When** the test constructs emails for `.co.uk`, hyphen, and underscore variants
- **Then** each email includes a timestamp and random component, not `Date.now()` alone

## REMOVED Requirements

### Requirement: REMOVED `uniqueEmail` as an alternative email generator

Reason for removal: `uniqueEmail` in `helpers/users.ts` used a worker/pid/counter strategy distinct from `createTestEmail`. Removing it eliminates two parallel strategies and their associated maintenance burden.

## Traceability

- Proposal element "Single canonical email generator" -> Requirement: MODIFIED `createTestEmail` is sole generator
- Design decision 3 (remove `uniqueEmail`) -> Requirement: REMOVED `uniqueEmail`
- Design decision 5 (fix special-email strings) -> Requirement: MODIFIED `createTestEmail` is sole generator
- Requirement MODIFIED -> Task: Remove `uniqueEmail` from `helpers/users.ts`
- Requirement MODIFIED -> Task: Fix `register.test.ts` special-email strings

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: grep confirms no raw `Date.now()`-only email patterns remain

- **Given** the integration test suite after migration
- **When** `grep -r "Date\.Now\|Date\.now()" tests/integration --include="*.ts"` is run
- **Then** zero matches (or only matches that are not email construction)
