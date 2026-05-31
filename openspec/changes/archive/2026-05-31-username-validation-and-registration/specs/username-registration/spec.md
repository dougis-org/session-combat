## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Username required at registration

The system SHALL require a `username` field in `POST /api/auth/register` and reject registrations where it is absent or invalid.

#### Scenario: Valid registration with username succeeds

- **Given** no user with the email or username exists
- **When** `POST /api/auth/register` is called with `{ email, password, username: "doug42" }`
- **Then** the response is `201` with body `{ userId, email, username, message }` and the user document in MongoDB has `username: "doug42"`

#### Scenario: Registration without username is rejected

- **Given** a registration request body with `email` and `password` but no `username` field
- **When** `POST /api/auth/register` is called
- **Then** the response is `400` with `{ error: "..." }` indicating username is required

#### Scenario: Registration with invalid username is rejected

- **Given** a registration request body with `username: "ab"` (too short)
- **When** `POST /api/auth/register` is called
- **Then** the response is `400` with `{ error: "..." }` containing a message about username validation

#### Scenario: Registration with reserved username is rejected

- **Given** a registration request body with `username: "Admin"`
- **When** `POST /api/auth/register` is called
- **Then** the response is `400` with `{ error: "..." }` indicating the username is reserved

#### Scenario: Duplicate username returns 409

- **Given** a user with `username: "doug42"` already exists
- **When** a second `POST /api/auth/register` is called with `username: "doug42"` (same casing)
- **Then** the response is `409` with `{ error: "Username already taken" }`

#### Scenario: Same username in different casing is accepted (case-sensitive uniqueness)

- **Given** a user with `username: "Doug42"` already exists
- **When** `POST /api/auth/register` is called with `username: "doug42"` (different casing)
- **Then** the response is `201` (both usernames are distinct at the DB layer)

#### Scenario: Duplicate email is still rejected independently

- **Given** a user with `email: "foo@example.com"` already exists
- **When** `POST /api/auth/register` is called with the same email but a new username
- **Then** the response is `409` with a message about email conflict (not username conflict)

## MODIFIED Requirements

_(none — no existing requirements are changed by this spec)_

## REMOVED Requirements

_(none)_

## Traceability

- Proposal element: `POST /api/auth/register` extended → Requirement: ADDED Username required at registration
- Design Decision 3 (DB-layer uniqueness + 11000 catch) → Scenarios: Duplicate username returns 409, Same username different casing accepted
- Design Decision 1 (validation module called before insert) → Scenarios: missing/invalid/reserved username rejected
- Requirement: ADDED Username required at registration → Task 2 (update register route)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Reserved words cannot be registered regardless of casing

- **Given** the reserved word `"moderator"` in any casing (`"Moderator"`, `"MODERATOR"`)
- **When** `POST /api/auth/register` is called with that username
- **Then** the response is `400` — the account is not created

### Requirement: Reliability

#### Scenario: Concurrent duplicate registration is handled by DB index

- **Given** two concurrent registration requests with the same username
- **When** both reach the `insertOne` call simultaneously
- **Then** exactly one succeeds with `201` and the other receives `409` — no duplicate user document is created
