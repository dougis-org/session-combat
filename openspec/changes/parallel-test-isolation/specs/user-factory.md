## ADDED Requirements

### Requirement: ADDED Parallel-safe user factory

The system SHALL provide a `createTestUser(baseUrl, prefix?)` function in `tests/integration/helpers/users.ts` that registers a user and returns `{ email, password, cookie, userId }`, using a unique email guaranteed to be distinct across workers and across multiple calls within the same test file.

#### Scenario: Multiple calls within one test file produce distinct users

- **Given** a test file calls `createTestUser(baseUrl, 'owner')` and then `createTestUser(baseUrl, 'guest')`
- **When** both registrations complete
- **Then** the two returned email addresses are different, and both registrations succeed with HTTP 201

#### Scenario: Same prefix across two workers produces distinct emails

- **Given** worker 1 and worker 2 both call `createTestUser(baseUrl, 'user')`
- **When** both registrations are sent to the shared server
- **Then** the emails differ (`user-w1-1@example.com` vs `user-w2-1@example.com`) and both succeed

#### Scenario: Unique email format is deterministic and debuggable

- **Given** `JEST_WORKER_ID=2` and the factory counter is at 3
- **When** `uniqueEmail('campaign')` is called
- **Then** the returned email is `campaign-w2-3@example.com`

#### Scenario: Factory works when JEST_WORKER_ID is absent

- **Given** `process.env.JEST_WORKER_ID` is not set (e.g., running outside Jest)
- **When** `uniqueEmail('user')` is called
- **Then** the returned email uses worker id `'0'` (e.g., `user-w0-1@example.com`) and does not throw

### Requirement: ADDED Factory supports multiple users per test file

The system SHALL allow any test file to call `createTestUser` any number of times, each returning a distinct user.

#### Scenario: Test file creates three users

- **Given** a test file needs an owner, a collaborator, and an admin user
- **When** it calls `createTestUser` three times with distinct prefixes
- **Then** three distinct `{ email, cookie, userId }` objects are returned with no registration conflicts

## MODIFIED Requirements

### Requirement: MODIFIED All integration test files use the shared factory

Integration test files SHALL use `createTestUser` from `tests/integration/helpers/users.ts` instead of `registerAndGetCookie` from `tests/integration/helpers/server.ts`.

#### Scenario: No test file imports registerAndGetCookie after migration

- **Given** the migration is complete
- **When** the codebase is searched for `registerAndGetCookie`
- **Then** no integration test file imports or calls it (the function itself may remain as a deprecated stub or be deleted)

## REMOVED Requirements

### Requirement: REMOVED `registerAndGetCookie` as the canonical user creation path

Reason for removal: Replaced by `createTestUser` which provides a richer return value (`userId` included), collision-safe email generation, and a clear extension point for future user attributes. `registerAndGetCookie` in `tests/integration/helpers/server.ts` is deleted as part of this change.

## Traceability

- Proposal element "Worker uniqueness (parallel-safe naming)" → Requirement: Parallel-safe user factory
- Design Decision 4 (JEST_WORKER_ID + counter) → Requirement: Parallel-safe user factory, factory supports multiple users
- Requirements → Tasks: Implement `tests/integration/helpers/users.ts`, Migrate test files to use `createTestUser`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No duplicate-email errors under parallel workers

- **Given** `maxWorkers` is temporarily set to 2 for a smoke test
- **When** two workers both call `createTestUser` with the same prefix
- **Then** no HTTP 409 / duplicate email error appears in test output
