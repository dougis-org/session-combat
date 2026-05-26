## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED `login.test.ts` uses `registerTestUser` for setup

The system SHALL have `login.test.ts` import `registerTestUser` from `helpers/users.ts` for user setup, and SHALL NOT import `registerUser` or `createTestEmail` from `auth.test.helpers.ts` (it may still import `loginUser`, assertion helpers, and constants).

#### Scenario: Login test happy path still passes

- **Given** `login.test.ts` migrated to use `registerTestUser` for setup
- **When** the integration suite runs
- **Then** all login tests pass and the setup user is successfully registered before each test

#### Scenario: `login.test.ts` has no `registerUser` or `createTestEmail` imports from auth helpers

- **Given** the migrated `login.test.ts`
- **When** `grep "registerUser\|createTestEmail" tests/integration/api/auth/login.test.ts` is run
- **Then** zero matches

### Requirement: MODIFIED `register.test.ts` retains `registerUser` as test subject

The system SHALL keep `registerUser` from `auth.test.helpers.ts` as the mechanism for directly calling the registration endpoint in `register.test.ts`. `registerUser` SHALL NOT be replaced by `registerTestUser` in this file.

#### Scenario: Registration error cases still exercise the endpoint directly

- **Given** `register.test.ts` after migration
- **When** tests for 409 conflict, invalid emails, weak passwords, missing fields run
- **Then** all pass; `registerUser` is still the call used (not `registerTestUser`)

## REMOVED Requirements

### Requirement: REMOVED `createTestUser` import from `helpers/users.ts` in all test files

Reason for removal: The async `createTestUser` export no longer exists in `helpers/users.ts` after rename to `registerTestUser`.

## Traceability

- Proposal element "`login.test.ts` setup migration" -> Requirement: MODIFIED `login.test.ts` uses `registerTestUser`
- Proposal element "`register.test.ts` keeps `registerUser` as test subject" -> Requirement: MODIFIED `register.test.ts` retains `registerUser`
- Design decision 4 (`login.test.ts` migration) -> Requirement: MODIFIED `login.test.ts`
- Requirement MODIFIED `login.test.ts` -> Task: Migrate login.test.ts setup calls
- Requirement MODIFIED `register.test.ts` -> Task: Update register.test.ts (special-email fix only)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: TypeScript compile confirms all renames are complete

- **Given** all 14 modified test files
- **When** `tsc --noEmit` runs
- **Then** zero type errors related to `createTestUser` / `registerTestUser` signature mismatches
