## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Central Admin Promotion Test Helper

The system SHALL provide a centralized helper function `makeUserAdmin` in the integration test suite to promote users to administrators.

#### Scenario: User successfully promoted to admin

- **Given** a registered user exists in the MongoDB database with a valid `userId` and `isAdmin` is not true.
- **When** `makeUserAdmin(userId)` is called and resolves.
- **Then** the user document in the database has `isAdmin: true`.

#### Scenario: Helper fails with non-existent user

- **Given** a valid ObjectId format string representing a non-existent user.
- **When** `makeUserAdmin(userId)` is called.
- **Then** the function rejects with an error message: `Failed to promote user to admin: user <userId> not found`.

---
### Requirement: ADDED Permissions Integration Test

The integration tests for permissions SHALL utilize the centralized admin promotion helper rather than managing a raw database connection.

#### Scenario: Permissions integration test verifies admin access using helper

- **Given** permissions integration tests are executing in the integration environment.
- **When** the admin user is registered using `registerTestUser` and promoted using `makeUserAdmin(userId)`.
- **Then** `isUserAdmin(userId)` returns `true` and the test file runs without declaring, connecting, or closing a raw `MongoClient`.

### Requirement: ADDED Campaign Global API Integration Test

The integration tests for the campaign global API SHALL utilize the centralized admin promotion helper rather than managing a raw database connection.

#### Scenario: Campaign Global API integration test verifies admin endpoints using helper

- **Given** campaign global API tests are executing in the integration environment.
- **When** the admin user cookie is registered and the user is promoted using `makeUserAdmin(userId)`.
- **Then** POST, PUT, and DELETE administrative endpoints respond as expected and the test file runs without declaring, connecting, or closing a raw `MongoClient`.

---

## Traceability

- **Proposal element** -> **Requirement**:
  - In-scope: Create `makeUserAdmin` helper -> Requirement: `ADDED Central Admin Promotion Test Helper`
  - In-scope: Refactor permissions tests -> Requirement: `MODIFIED Permissions Integration Test`
  - In-scope: Refactor campaign global API tests -> Requirement: `MODIFIED Campaign Global API Integration Test`
- **Design decision** -> **Requirement**:
  - Decision 1 (Placement/Signature) -> Requirement: `ADDED Central Admin Promotion Test Helper`
  - Decision 2 (Lifecycle) -> Requirement: `ADDED Central Admin Promotion Test Helper`
- **Requirement** -> **Task(s)**:
  - ADDED Central Admin Promotion Test Helper -> Implementation of `makeUserAdmin` in helper file.
  - MODIFIED Permissions Integration Test -> Refactoring permissions test suite.
  - MODIFIED Campaign Global API Integration Test -> Refactoring campaign global API test suite.

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Database connection safety

- **Given** the database operation inside `makeUserAdmin` fails (e.g., due to a write query error).
- **When** the query execution throws an exception.
- **Then** the `MongoClient` instance created by the helper is guaranteed to be closed, leaving no open file descriptors or active network handles.
