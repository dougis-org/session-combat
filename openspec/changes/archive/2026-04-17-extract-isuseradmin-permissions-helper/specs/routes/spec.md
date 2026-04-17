## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Routes handle null from `isUserAdmin` as 500

The system SHALL return HTTP 500 with `{ error: 'Internal server error' }` when `isUserAdmin` returns `null`.

#### Scenario: DB error during admin check on POST /api/monsters/global

- **Given** an authenticated request to POST `/api/monsters/global`
- **When** `isUserAdmin` returns `null` due to a DB error
- **Then** the route returns HTTP 500

#### Scenario: DB error during admin check on PUT /api/monsters/global/[id]

- **Given** an authenticated request to PUT `/api/monsters/global/[id]`
- **When** `isUserAdmin` returns `null` due to a DB error
- **Then** the route returns HTTP 500

#### Scenario: DB error during admin check on DELETE /api/monsters/global/[id]

- **Given** an authenticated request to DELETE `/api/monsters/global/[id]`
- **When** `isUserAdmin` returns `null` due to a DB error
- **Then** the route returns HTTP 500

## MODIFIED Requirements

### Requirement: MODIFIED Routes import `isUserAdmin` from shared module

The system SHALL import `isUserAdmin` from `lib/permissions` rather than defining it locally.

#### Scenario: Import resolves correctly

- **Given** `lib/permissions.ts` exists and exports `isUserAdmin`
- **When** TypeScript compiles the route files
- **Then** no import errors; function signature matches expected `Promise<boolean | null>`

## REMOVED Requirements

### Requirement: REMOVED Locally-defined `isUserAdmin` in route files

Reason for removal: Both local definitions deleted. Import from `lib/permissions` replaces them.

## Traceability

- Proposal element "Update both route files to import from lib/permissions and handle null → 500" → Requirement: ADDED null → 500 handling
- Design decision 1 (null sentinel) → ADDED scenarios for each route
- Requirement ADDED → Task: Update route.ts, Update [id]/route.ts
- Requirement MODIFIED → Task: Update route.ts, Update [id]/route.ts

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No silent status code downgrade

- **Given** DB failure during admin check
- **When** any admin-protected route is called
- **Then** caller receives 500, never a silent 403 masking the infrastructure failure
