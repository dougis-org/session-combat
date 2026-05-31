## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED `GET /api/auth/me` response includes username

The system SHALL include the authenticated user's `username` in the `GET /api/auth/me` response body.

#### Scenario: Authenticated user receives username in response

- **Given** a registered user with `username: "doug42"` and a valid auth cookie
- **When** `GET /api/auth/me` is called
- **Then** the response is `200` with body `{ authenticated: true, userId, email, isAdmin, username: "doug42" }`

#### Scenario: Response shape is backward-compatible

- **Given** any existing consumer of `GET /api/auth/me`
- **When** the updated endpoint is called
- **Then** all previously present fields (`authenticated`, `userId`, `email`, `isAdmin`) are still present in the response — `username` is additive only

#### Scenario: Unauthenticated request is still rejected

- **Given** a request with no auth cookie
- **When** `GET /api/auth/me` is called
- **Then** the response is `401` (behavior unchanged from before this change)

## ADDED Requirements

_(none — no new capability, only an extension of existing response shape)_

## REMOVED Requirements

_(none)_

## Traceability

- Proposal element: `GET /api/auth/me` returns username → Requirement: MODIFIED `GET /api/auth/me` response includes username
- Design Decision 4 (read `username` from already-fetched user document) → Scenario: Authenticated user receives username in response
- Requirement: MODIFIED `GET /api/auth/me` → Task 3 (update me route)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: `username` is present when user document has it

- **Given** a user document that has `username` set (all users post-1a backfill)
- **When** `GET /api/auth/me` is called
- **Then** `username` is non-null and matches the stored value
