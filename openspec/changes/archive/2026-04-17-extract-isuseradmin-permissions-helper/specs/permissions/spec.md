## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Shared `isUserAdmin` authorization helper

The system SHALL export `isUserAdmin(userId: string): Promise<boolean | null>` from `lib/permissions.ts`, returning `true` for admin users, `false` for non-admin users, and `null` on DB error.

#### Scenario: Admin user lookup succeeds

- **Given** a MongoDB user document exists with `isAdmin: true` for the given userId
- **When** `isUserAdmin(userId)` is called
- **Then** the function returns `true`

#### Scenario: Non-admin user lookup succeeds

- **Given** a MongoDB user document exists without `isAdmin: true` for the given userId
- **When** `isUserAdmin(userId)` is called
- **Then** the function returns `false`

#### Scenario: User not found

- **Given** no MongoDB user document exists for the given userId
- **When** `isUserAdmin(userId)` is called
- **Then** the function returns `false`

#### Scenario: DB error during lookup

- **Given** the MongoDB connection fails or throws during the query
- **When** `isUserAdmin(userId)` is called
- **Then** the function returns `null` (not `false`, not throws)

#### Scenario: Invalid ObjectId format

- **Given** the userId string cannot be parsed as a valid MongoDB ObjectId
- **When** `isUserAdmin(userId)` is called
- **Then** the function returns `null`

## MODIFIED Requirements

### Requirement: MODIFIED Admin check in global monster routes

The system SHALL check admin status by importing `isUserAdmin` from `lib/permissions.ts` instead of using a locally-defined function.

#### Scenario: Behavior unchanged for admin user

- **Given** an authenticated user who is an admin
- **When** a POST to `/api/monsters/global` or PUT/DELETE to `/api/monsters/global/[id]` is made
- **Then** the route proceeds identically to current behavior (no HTTP-visible change)

#### Scenario: Behavior unchanged for non-admin user

- **Given** an authenticated user who is not an admin
- **When** a POST to `/api/monsters/global` or PUT/DELETE to `/api/monsters/global/[id]` is made
- **Then** the route returns 403 identically to current behavior

## REMOVED Requirements

### Requirement: REMOVED Local `isUserAdmin` definitions in route files

Reason for removal: Duplication eliminated by extraction to `lib/permissions.ts`. Local definitions in `app/api/monsters/global/route.ts` and `app/api/monsters/global/[id]/route.ts` are removed.

## Traceability

- Proposal element "Extract isUserAdmin to lib/permissions.ts" → Requirement: ADDED Shared helper
- Proposal element "Surface DB errors as null → 500" → Requirement: ADDED (null on DB error scenario)
- Design decision 1 (null sentinel) → ADDED scenarios: "DB error" and "Invalid ObjectId"
- Design decision 2 (lib/permissions.ts) → MODIFIED requirement: admin check in routes
- Requirement ADDED → Task: Create lib/permissions.ts, Write permissions.test.ts
- Requirement MODIFIED → Task: Update route.ts and [id]/route.ts imports

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: DB failure does not silently return wrong status

- **Given** MongoDB is unavailable
- **When** an admin-protected route is called
- **Then** the route returns HTTP 500 (not 403)

### Requirement: Security

#### Scenario: Admin check uses same field and logic as before

- **Given** the extracted `isUserAdmin` implementation
- **When** compared to the original local implementations
- **Then** the DB field checked (`isAdmin`), the collection queried (`users`), and the truthiness test (`=== true`) are identical — no behavior change for the success path
