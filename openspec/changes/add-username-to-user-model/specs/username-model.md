## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Username field on User type

The system SHALL accept an optional `username` string field on the `User` interface.

#### Scenario: User object with username is valid TypeScript

- **Given** the `User` interface in `lib/types.ts` has `username?: string`
- **When** TypeScript compiles a `User` object that includes `username: "doug"`
- **Then** compilation succeeds with no type errors

#### Scenario: User object without username is valid TypeScript

- **Given** the `User` interface has `username?: string`
- **When** TypeScript compiles a `User` object that omits the `username` field entirely
- **Then** compilation succeeds with no type errors

---

### Requirement: ADDED Sparse unique index on users.username

The system SHALL enforce case-sensitive uniqueness on `users.username` at the database layer, skipping documents where the field is absent.

#### Scenario: Two users with different usernames can coexist

- **Given** the sparse unique index exists on `users.username`
- **When** two documents are inserted with `username: "Alice"` and `username: "alice"`
- **Then** both inserts succeed (case-sensitive, distinct values)

#### Scenario: Duplicate username is rejected

- **Given** a user document with `username: "doug"` already exists
- **When** a second document is inserted with `username: "doug"`
- **Then** MongoDB returns a duplicate key error (code 11000)

#### Scenario: Documents without username do not conflict

- **Given** the sparse unique index on `users.username`
- **When** multiple user documents are inserted without a `username` field
- **Then** all inserts succeed (sparse index skips absent fields)

#### Scenario: Index creation failure does not crash app startup

- **Given** `initializeDatabase` is called and `users.username` index creation throws an unexpected error
- **When** the error is caught in the isolated try/catch block
- **Then** `initializeDatabase` logs a warning and continues without rethrowing

---

### Requirement: ADDED Idempotent username backfill script

The system SHALL provide a one-shot migration script that assigns a username (derived from email local-part) to every user document that lacks one, and is safe to re-run.

#### Scenario: Users without username receive a username

- **Given** the `users` collection contains documents without a `username` field
- **When** `scripts/backfill-usernames.ts` is run
- **Then** every user document that lacked `username` now has one set to the local-part of their email address

#### Scenario: Email local-part collision de-duplicated with suffix

- **Given** two users exist with emails `foo@a.com` and `foo@b.com`
- **When** the backfill runs
- **Then** one receives `username: "foo"` and the other receives `username: "foo-2"`

#### Scenario: Already-assigned usernames are not overwritten

- **Given** a user document already has `username: "doug"`
- **When** the backfill runs
- **Then** the document's `username` field is unchanged

#### Scenario: Second run of backfill is a no-op

- **Given** all user documents already have `username` set
- **When** the backfill script is run a second time
- **Then** no documents are modified and no errors are thrown

## MODIFIED Requirements

_(none — no existing requirements are changed by this issue)_

## REMOVED Requirements

_(none)_

## Traceability

- Proposal: `username?: string` on `User` -> Requirement: ADDED Username field on User type
- Proposal: Sparse unique index -> Requirement: ADDED Sparse unique index on users.username
- Proposal: Idempotent backfill script -> Requirement: ADDED Idempotent username backfill script
- Design Decision 1 (sparse index) -> Requirement: ADDED Sparse unique index
- Design Decision 2 (case-sensitive) -> Scenario: Two users with different usernames can coexist
- Design Decision 3 (isolated try/catch) -> Scenario: Index creation failure does not crash app startup
- Design Decision 4 (email local-part + suffix) -> Scenario: Email local-part collision de-duplicated
- Design Decision 5 (standalone script) -> Requirement: ADDED Idempotent username backfill script
- All requirements -> Tasks: task-1 (types), task-2 (index), task-3 (backfill script)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Index creation failure is non-fatal

- **Given** `initializeDatabase` is called and the username index creation throws
- **When** the error is caught in the isolated try/catch
- **Then** the function continues and the application starts successfully

#### Scenario: Backfill is safe to re-run

- **Given** all users already have usernames assigned
- **When** the backfill script is executed again
- **Then** it exits cleanly with zero documents modified
