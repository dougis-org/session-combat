## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Party member add regression test

The system SHALL have a test that verifies adding a member to an existing party via the edit flow increases the member count.

#### Scenario: Add a member to an existing party

- **Given** a fresh user with characters "Aragorn" and "Legolas" seeded, and a party "Fellowship" created with only "Aragorn"
- **When** the user edits the party, checks "Legolas", and saves
- **Then** the party card shows "Members: 2"

#### Scenario: Added member name appears on party card

- **Given** a party with "Aragorn" only, after adding "Legolas" via the edit flow
- **When** the party list is shown
- **Then** "Legolas" is visible on the Fellowship party card

---

### Requirement: ADDED Party member remove regression test

The system SHALL have a test that verifies removing a member from an existing party via the edit flow decreases the member count.

#### Scenario: Remove a member from an existing party

- **Given** a fresh user with "Aragorn" and "Legolas" seeded, and a party "Fellowship" with both members
- **When** the user edits the party, unchecks "Aragorn", and saves
- **Then** the party card shows "Members: 1"

#### Scenario: Removed member name no longer appears on party card

- **Given** a party with "Aragorn" and "Legolas", after removing "Aragorn" via the edit flow
- **When** the party list is shown
- **Then** "Aragorn" is not visible on the Fellowship party card, "Legolas" is

---

### Requirement: ADDED Party card shows correct names after member changes

The system SHALL display accurate member names on the party card after both add and remove edits.

#### Scenario: Party card reflects final member state after multiple edits

- **Given** a party created with "Aragorn", then "Legolas" added, then "Aragorn" removed
- **When** the party list is displayed
- **Then** the card shows "Members: 1" and "Legolas" is visible; "Aragorn" is not

## MODIFIED Requirements

_None in this spec — all requirements are new._

## REMOVED Requirements

_None — this is an additive spec._

## Traceability

- Proposal element "New member add/remove regression tests" → all requirements in this spec
- Design decision 2 (inline `seedCharacter` per test / describe-scoped `beforeEach`) → test setup pattern
- Requirements → Tasks: T4 (add `"Party member management"` describe block in `parties.spec.ts`)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Member management tests are idempotent

- **Given** no pre-existing data in the DB
- **When** the `"Party member management"` describe block runs
- **Then** all three tests pass — setup is entirely self-contained via `registerUser` + `seedCharacter`

### Requirement: Reliability

#### Scenario: Member management tests are thread-safe

- **Given** the `beforeEach` registers a fresh user and seeds characters with identity-prefixed names per test
- **When** parallel workers run the add and remove tests simultaneously
- **Then** each worker operates on its own user's data; no cross-contamination occurs
