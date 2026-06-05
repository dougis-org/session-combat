## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Upload route unit test coverage

The system SHALL have ≥85% statement coverage for `app/api/monsters/upload/route.ts` via unit tests in `tests/unit/api/monsters/upload.route.test.ts`.

#### Scenario: Unauthenticated request rejected

- **Given** a POST to `/api/monsters/upload` with no valid auth cookie
- **When** `requireAuth` returns an Unauthorized response
- **Then** the handler returns HTTP 401

#### Scenario: Malformed JSON body

- **Given** an authenticated POST to `/api/monsters/upload`
- **When** the request body is not valid JSON
- **Then** the handler returns HTTP 400 with `error` containing "Invalid JSON"

#### Scenario: Missing monsters key

- **Given** an authenticated POST with body `{}`
- **When** the handler validates the document
- **Then** the handler returns HTTP 400 with a validation error message

#### Scenario: monsters is not an array

- **Given** an authenticated POST with body `{ "monsters": "not-an-array" }`
- **When** the handler validates the document
- **Then** the handler returns HTTP 400

#### Scenario: Empty monsters array

- **Given** an authenticated POST with body `{ "monsters": [] }`
- **When** the handler validates the document
- **Then** the handler returns HTTP 400

#### Scenario: Monster missing required name field

- **Given** an authenticated POST with body `{ "monsters": [{ "maxHp": 10 }] }`
- **When** the handler validates the document
- **Then** the handler returns HTTP 400

#### Scenario: Monster missing required maxHp field

- **Given** an authenticated POST with body `{ "monsters": [{ "name": "Beast" }] }`
- **When** the handler validates the document
- **Then** the handler returns HTTP 400

#### Scenario: Single valid monster, save succeeds

- **Given** an authenticated POST with body `{ "monsters": [{ "name": "Goblin", "maxHp": 7 }] }`
- **When** `storage.saveMonsterTemplate` resolves successfully
- **Then** the handler returns HTTP 201 with `count: 1` and `imported` array of length 1

#### Scenario: Multiple valid monsters, all save

- **Given** an authenticated POST with two valid monsters
- **When** both `storage.saveMonsterTemplate` calls resolve
- **Then** the handler returns HTTP 201 with `count: 2` and `imported` of length 2

#### Scenario: Partial save failure (207)

- **Given** an authenticated POST with two valid monsters
- **When** the first `storage.saveMonsterTemplate` resolves and the second throws
- **Then** the handler returns HTTP 207 with `count: 1` and a non-empty `errors` array

#### Scenario: All saves fail

- **Given** an authenticated POST with a valid monster
- **When** `storage.saveMonsterTemplate` throws on every call
- **Then** the handler returns HTTP 500

---

### Requirement: ADDED Upload route integration test coverage

The system SHALL have integration tests for `POST /api/monsters/upload` appended to `tests/integration/monsters.integration.test.ts`.

#### Scenario: Valid upload, monsters queryable after

- **Given** an authenticated user posts `{ "monsters": [{ "name": "Upload Beast", "maxHp": 22 }] }`
- **When** the server processes the request against the real DB
- **Then** the response is HTTP 201 and `GET /api/monsters` subsequently returns a monster named "Upload Beast"

#### Scenario: Upload without authentication

- **Given** a POST to `/api/monsters/upload` with no auth cookie
- **When** the server processes the request
- **Then** the response is HTTP 401

#### Scenario: Upload with missing monsters key

- **Given** an authenticated POST with body `{}`
- **When** the server validates the document
- **Then** the response is HTTP 400

---

## MODIFIED Requirements

### Requirement: MODIFIED 207 partial-success page message

The system SHALL display the correct imported count and error detail when the upload API returns HTTP 207.

#### Scenario: Partial success displays real counts

- **Given** the import page submits a file and the server returns HTTP 207 with `{ count: 3, total: 5, errors: [{ index: 3, message: "..." }, { index: 4, message: "..." }] }`
- **When** the page handles the 207 response
- **Then** the user sees a message like "Successfully imported 3 of 5 monsters." followed by the per-item error details — not "0 of 0 monsters"

---

## REMOVED Requirements

No requirements removed.

---

## Traceability

- Proposal element "0% coverage on upload route" → Requirement: Upload route unit test coverage → Tasks: Write unit test file
- Proposal element "207 dead UX" → Requirement: MODIFIED 207 partial-success page message → Tasks: Fix page.tsx 207 handler
- Proposal element "Integration test for happy path" → Requirement: Upload route integration test coverage → Tasks: Append integration tests
- Design Decision 1 (unit test mocking strategy) → Requirement: Upload route unit test coverage
- Design Decision 2 (207 mock pattern) → Scenario: Partial save failure (207)
- Design Decision 3 (integration user isolation) → Scenario: Valid upload, monsters queryable after
- Design Decision 4 (fix page.tsx reads) → Requirement: MODIFIED 207 partial-success page message

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Uploaded monsters are user-scoped

- **Given** integration tests upload monsters as the `"upload-test"` user
- **When** another test user calls `GET /api/monsters`
- **Then** the uploaded monsters do not appear in that user's response

### Requirement: Operability

#### Scenario: Tests run without new config

- **Given** the new test file and appended integration tests are committed
- **When** `npm run test:unit` and the integration test command are run
- **Then** all tests pass without changes to `jest.config.js` or `jest.integration.config.js`
