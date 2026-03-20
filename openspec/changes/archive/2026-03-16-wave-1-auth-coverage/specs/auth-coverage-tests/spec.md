## ADDED Requirements

### Requirement: Parallel-safe test execution
All unit and integration tests MUST be parallel-safe: each test independently sets up and tears down its own state (database connections, test data, fixtures). No shared global state, no interdependencies between tests. Tests SHALL pass when run sequentially or in parallel (via `jest --maxWorkers=5` or similar). Parallel execution MUST complete within 10 minutes maximum (to prevent infinite loops from test hangs; performance optimization is a later phase).

### Requirement: Test data generation
Unit and integration tests SHALL generate fresh user data for each test run (no shared state, no reuse across tests). Read-only seeded catalog data (Monsters, characters, etc) MAY be used as reference data.

### Requirement: Unit test coverage for lib/auth.ts token functions
The system SHALL have comprehensive unit tests for all token generation, validation, and expiry logic in `lib/auth.ts`, covering normal paths, edge cases, and error conditions. Tests SHALL cover internal and private functions if they are widely used; centralized testing of internal behavior is a good practice for maintainability. Security-specific tests (e.g., password hashing verification, salt iterations) are OUT OF SCOPE for Wave 1 and deferred to security hardening phase.

#### Scenario: Generate valid JWT token
- **WHEN** a test calls generateToken() with valid user credentials
- **THEN** a valid JWT token is returned with correct payload and signature

#### Scenario: Validate correct token
- **WHEN** a test calls verifyToken() with a valid, non-expired token
- **THEN** verifyToken returns the decoded payload

#### Scenario: Reject expired token
- **WHEN** a test calls verifyToken() with a token past its expiry time
- **THEN** verifyToken returns null

#### Scenario: Reject malformed token
- **WHEN** a test calls verifyToken() with a malformed or corrupted token string
- **THEN** verifyToken returns null

#### Scenario: Reject missing token
- **WHEN** a test calls verifyToken() with undefined or null input
- **THEN** verifyToken returns null

#### Scenario: Handle special characters in payload
- **WHEN** a test generates a token with user email containing special characters (e.g., +, -, _)
- **THEN** token is generated and validated correctly without encoding issues

#### Scenario: Unit tests are parallel-safe and generate fresh data
- **WHEN** unit tests are run concurrently (e.g., `jest --maxWorkers=5`)
- **THEN** all tests pass without race conditions or shared state corruption; each test uses fresh user data (no shared fixtures)

### Out-of-Scope: Security Testing & Message String Testing
Password hashing verification, rate-limiting, brute-force protection, and other security hardening tests are OUT OF SCOPE for Wave 1. These will be addressed in a dedicated security hardening phase after auth coverage establishes baseline functionality.

Tests MUST NOT validate against message strings (too brittle). Instead, test error codes, status codes, and response enums that reflect the implementation contract. If current code returns pass/fail boolean without structured error codes, accept that as the current contract and do not create test failures around it.

### Requirement: Integration test coverage for POST /api/auth/register route
The system SHALL have comprehensive integration tests for user registration, covering success cases, validation errors, and database state. Tests SHALL use test containers for MongoDB isolation and MUST be parallel-safe (independent for each test run).

#### Scenario: Register new user successfully
- **WHEN** a test POSTs to `/api/auth/register` with valid email and password
- **THEN** response status is 201, user is created in MongoDB with hashed password, response includes auth token

#### Scenario: Reject registration with duplicate email
- **WHEN** a test POSTs to `/api/auth/register` with an email already in the database
- **THEN** response status is 409 (conflict), user is not created, response error code/enum indicates duplicate email

#### Scenario: Reject registration with invalid email format
- **WHEN** a test POSTs to `/api/auth/register` with malformed email (e.g., "not-an-email")
- **THEN** response status is 400, user is not created, response error code/enum indicates invalid format

#### Scenario: Reject registration with weak password
- **WHEN** a test POSTs to `/api/auth/register` with password failing requirements (too short, no uppercase, etc.)
- **THEN** response status is 400, user is not created, response error code/enum indicates password validation failure (test error codes, not message strings)

#### Scenario: Reject registration with missing fields
- **WHEN** a test POSTs to `/api/auth/register` with missing email or password field
- **THEN** response status is 400, user is not created, response error code/enum indicates missing fields (test error codes, not message strings)

### Requirement: Integration test coverage for POST /api/auth/login route
The system SHALL have comprehensive integration tests for user login, covering success cases, authentication failures, and session state.

#### Scenario: Login with correct credentials
- **WHEN** a test POSTs to `/api/auth/login` with email and password matching a registered user
- **THEN** response status is 200, response includes valid auth token, subsequent requests with token are authenticated

#### Scenario: Reject login with wrong password
- **WHEN** a test POSTs to `/api/auth/login` with correct email but incorrect password
- **THEN** response status is 401 (unauthorized), no token issued, user session not created

#### Scenario: Reject login for nonexistent user
- **WHEN** a test POSTs to `/api/auth/login` with email not in database
- **THEN** response status is 401 (not found or generic auth failure), no token issued

#### Scenario: Reject login without credentials
- **WHEN** a test POSTs to `/api/auth/login` with missing email or password
- **THEN** response status is 400, no token issued, response error code/enum indicates missing fields (test error codes, not message strings)

#### Scenario: Token issued at login remains valid for subsequent requests
- **WHEN** a test logs in (receiving token), then makes an authenticated request with that token in Authorization header
- **THEN** authenticated request succeeds and returns user data

### Requirement: Integration test coverage for POST /api/auth/logout route
The system SHALL have comprehensive integration tests for logout, covering session clearing and token rejection. Because the implementation uses stateless JWTs (no server-side session store), logout clears the auth cookie on the client but cannot revoke the token itself — a second request with the same unexpired token will still pass `verifyAuth`.

#### Scenario: Logout clears session
- **WHEN** a logged-in test POSTs to `/api/auth/logout` with valid auth token
- **THEN** response status is 200 and the response clears the auth cookie (client is no longer automatically authenticated)

#### Scenario: Logout is idempotent for stateless JWTs
- **WHEN** a test POSTs to `/api/auth/logout` twice with the same unexpired token
- **THEN** both responses return 200 (the token is structurally valid; no server-side session exists to invalidate)

#### Scenario: Reject logout without token
- **WHEN** a test POSTs to `/api/auth/logout` without providing an auth token
- **THEN** response status is 401 (unauthorized), user is already logged out

#### Scenario: Reject logout with invalid token
- **WHEN** a test POSTs to `/api/auth/logout` with malformed or expired token
- **THEN** response status is 401, no error logged for valid session

### Requirement: Coverage measurement and reporting
The system SHALL measure and report coverage deltas for auth module before and after test implementation.

#### Scenario: Baseline coverage captured
- **WHEN** coverage run completes before new tests are written
- **THEN** coverage summary shows 0% for lib/auth.ts and /api/auth/* modules

#### Scenario: Final coverage captured and compared
- **WHEN** all Wave 1 auth tests pass and coverage is re-run
- **THEN** coverage summary shows >50% for lib/auth.ts and >60% for /api/auth/* modules, delta documented in issue #72

#### Scenario: Codacy receives updated coverage
- **WHEN** final coverage artifacts (lcov.info) are uploaded to Codacy
- **THEN** Codacy project shows updated line coverage including new auth test contributions
