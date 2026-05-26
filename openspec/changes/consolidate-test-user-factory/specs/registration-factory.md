## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED `registerTestUser` replaces `createTestUser` as the HTTP registration helper

The system SHALL export `registerTestUser(baseUrl: string, prefix?: string): Promise<{ email: string; password: string; cookie: string; userId: string }>` from `tests/integration/helpers/users.ts`, and SHALL NOT export `createTestUser` or `uniqueEmail` from that file.

#### Scenario: Happy path — successful registration

- **Given** a running test server at `baseUrl`
- **When** `registerTestUser(baseUrl, "myprefix")` is called
- **Then** it returns `{ email, password, cookie, userId }` where `email` matches `myprefix-*@example.com`, `cookie` is a valid auth-token string, and `userId` is a non-empty string

#### Scenario: Email is generated via `createTestUser` from `auth.test.helpers.ts`

- **Given** `helpers/users.ts` is loaded
- **When** `registerTestUser` generates an email internally
- **Then** the email originates from `createTestUser` imported from `auth.test.helpers.ts`, not from any logic defined in `helpers/users.ts`

#### Scenario: Registration failure throws

- **Given** the server returns a non-201 status
- **When** `registerTestUser` receives that response
- **Then** it throws an error containing the status code and response body

### Requirement: MODIFIED All non-auth integration test files use `registerTestUser`

The system SHALL have zero imports of `createTestUser` from `tests/integration/helpers/users` across all integration test files.

#### Scenario: Migrated files compile and pass

- **Given** the 12 test files that previously imported `createTestUser` from `helpers/users.ts`
- **When** `tsc --noEmit` and the integration suite run
- **Then** no type errors and all tests pass

## REMOVED Requirements

### Requirement: REMOVED `uniqueEmail` export from `helpers/users.ts`

Reason for removal: Superseded by `createTestEmail` in `auth.test.helpers.ts`, which uses the same collision-safe strategy. No external consumers exist.

### Requirement: REMOVED async `createTestUser` export from `helpers/users.ts`

Reason for removal: Renamed to `registerTestUser` to eliminate name collision with the sync data-factory `createTestUser` in `auth.test.helpers.ts`.

## Traceability

- Proposal element "Single HTTP registration helper" -> Requirement: MODIFIED `registerTestUser`
- Design decision 2 (rename) -> Requirement: MODIFIED `registerTestUser`
- Design decision 3 (remove `uniqueEmail`) -> Requirement: REMOVED `uniqueEmail`
- Requirement MODIFIED `registerTestUser` -> Task: Update `helpers/users.ts`
- Requirement MODIFIED `All non-auth files use registerTestUser` -> Task: Rename call sites in 12 files

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No silent name collision between factories

- **Given** a developer imports `createTestUser` in a test file
- **When** TypeScript resolves the import
- **Then** it can only resolve to `auth.test.helpers.ts` (sync data factory); the async registration function is only reachable as `registerTestUser` from `helpers/users.ts`
