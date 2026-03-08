## ADDED Requirements

### Requirement: Integration tests authenticate before calling protected endpoints
Integration tests that test protected API routes SHALL first register a test user via `POST /api/auth/register`, capture the session cookie from the `Set-Cookie` response header, and include that cookie in subsequent requests. Tests SHALL NOT accept `401 Unauthorized` as a passing response for a scenario that is intended to test the authenticated happy path.

#### Scenario: Monster creation test uses an authenticated session
- **WHEN** the integration test calls `POST /api/monsters` to create a monster
- **THEN** the request includes a valid session cookie obtained from a prior registration call
- **AND** the test asserts the response status is `201 Created`
- **AND** the test asserts the response body contains the monster's `name`, `hp`, `maxHp`, and `id`

#### Scenario: Character list test uses an authenticated session
- **WHEN** the integration test calls `GET /api/characters`
- **THEN** the request includes a valid session cookie
- **AND** the test asserts the response status is `200 OK`

#### Scenario: 401 is only asserted when explicitly testing unauthenticated access
- **WHEN** a test is specifically verifying that a protected endpoint rejects unauthenticated requests
- **THEN** the test sends the request without a session cookie and asserts `401`
- **AND** this test is clearly named to reflect its intent (e.g., "should reject unauthenticated request")

### Requirement: Integration test assertions are not overly permissive
Integration test assertions SHALL NOT use multi-value status code arrays that include error codes alongside success codes for the same scenario (e.g., `expect([201, 409, 500]).toContain(response.status)`). Each test scenario SHALL assert exactly the status code that the documented behaviour specifies.

#### Scenario: Registration success test asserts 201 only
- **WHEN** a new user is registered with a unique email and a valid password
- **THEN** the test asserts `response.status === 201` exactly
- **AND** does not also accept 409 or 500 as passing

#### Scenario: Duplicate email test asserts 409 only
- **WHEN** a second registration attempt uses an already-registered email
- **THEN** the test asserts `response.status === 409` exactly

#### Scenario: Health endpoint test asserts 200 and response body
- **WHEN** `GET /api/health` is called
- **THEN** the test asserts `response.status === 200` and body equals `{ ok: true }`

### Requirement: Duplicate integration test files are removed
`tests/integration/monsters-copy.test.ts` SHALL be deleted if it contains no unique test cases not already covered by `tests/integration/monsters.integration.test.ts`. If it does contain unique tests, those SHALL be migrated to the canonical file before deletion.

#### Scenario: Only one monster integration test file exists
- **WHEN** the `tests/integration/` directory is audited
- **THEN** there is exactly one file testing the monsters API integration (no `-copy` files)

### Requirement: waitForServer polling uses explicit logging and bounded retries
The `waitForServer` helper used in integration test setup SHALL log each retry attempt and SHALL surface the final failure error with a message indicating how many attempts were made and what URL was being polled, rather than silently timing out.

#### Scenario: Server readiness timeout produces a clear error
- **WHEN** the Next.js server does not become ready within the allowed attempts
- **THEN** `waitForServer` throws an error containing the URL, attempt count, and the last network error received
- **AND** this error causes the `beforeAll` to fail, aborting the test file with a clear diagnostic message
