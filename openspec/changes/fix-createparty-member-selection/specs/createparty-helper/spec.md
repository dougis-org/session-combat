## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED `createParty()` selects members by label, not position

The system SHALL select party member checkboxes by matching the character's name via `getByLabel(name)` rather than by DOM position index.

#### Scenario: Members selected by name

- **Given** a user is logged in with characters "Aragorn" and "Legolas" seeded in their account
- **When** `createParty(page, { name: "Fellowship", memberNames: ["Aragorn", "Legolas"] })` is called
- **Then** the party is saved with exactly those two members, and the party card shows "Members: 2"

#### Scenario: Empty member list creates a party with no members

- **Given** a user is logged in
- **When** `createParty(page, { name: "Empty Party", memberNames: [] })` is called
- **Then** the party is saved successfully and the party card shows "Members: 0"

#### Scenario: Name not found fails loudly

- **Given** a user is logged in with no characters seeded
- **When** `createParty(page, { name: "Bad Party", memberNames: ["Ghost"] })` is called
- **Then** Playwright throws a locator error because no label matching "Ghost" exists — the test fails visibly, not silently

## REMOVED Requirements

### Requirement: REMOVED Positional checkbox selection via `memberCount`

Reason for removal: Positional selection is order-dependent and produces silent empty parties when no characters exist. Replaced by name-based selection.

## Traceability

- Proposal element "Replace positional selection" → Requirement: MODIFIED `createParty()` selects members by label
- Design decision 1 (`memberNames[]` replaces `memberCount`) → Requirement: MODIFIED `createParty()` selects members by label
- Requirement → Task: T1 (refactor `createParty` signature and implementation)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Parallel test isolation

- **Given** multiple Playwright workers running party tests simultaneously
- **When** each test calls `createParty` with its own user-scoped character names
- **Then** no worker's character list pollutes another worker's party editor; all tests pass

### Requirement: Reliability

#### Scenario: Idempotent on clean DB

- **Given** a freshly reset database with no characters or parties
- **When** a test seeds its characters via `seedCharacter` and calls `createParty` with those names
- **Then** the test passes without relying on any pre-existing state
