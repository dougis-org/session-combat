## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED soft-delete 404 test asserts all intermediate HTTP responses

The test "should return 404 when accessing deleted character detail" SHALL assert the HTTP status of the character creation (POST) and the soft-delete (DELETE) requests before asserting the final GET returns 404, ensuring that a failure in any step produces an immediate, targeted assertion error rather than a confusing end-of-test failure.

#### Scenario: All steps pass — test verifies 404 on deleted character

- **Given** the integration test server is running and the test user is authenticated
- **When** the test POSTs a new character, DELETEs it, and then GETs it
- **Then** the POST assertion `expect(createRes.status).toBe(201)` passes, the DELETE assertion `expect(deleteRes.status).toBe(200)` passes, and the GET assertion `expect(detailRes.status).toBe(404)` passes

#### Scenario: Character creation fails — test fails at the correct assertion

- **Given** the POST to create a character returns a non-201 status (server error, conflict, etc.)
- **When** the test executes
- **Then** `expect(createRes.status).toBe(201)` fails immediately, clearly identifying the create step as the source of the problem

#### Scenario: Delete operation fails — test fails at the correct assertion

- **Given** the character is created successfully (POST returns 201) but the DELETE returns a non-200 status
- **When** the test executes
- **Then** `expect(deleteRes.status).toBe(200)` fails immediately, clearly identifying the delete step as the source of the problem rather than producing a confusing 200 on the final GET

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element: 404 test missing intermediate assertions -> Requirement: MODIFIED soft-delete 404 test asserts all intermediate HTTP responses
- Design decision: Decision 3 (explicit status assertions) -> Requirement: MODIFIED soft-delete 404 test asserts all intermediate HTTP responses
- Requirement -> Task(s): Task 3 in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** CI re-triggers the integration test suite after a transient failure
- **When** all three HTTP operations (POST, DELETE, GET) complete successfully
- **Then** the test passes without flaking, and no assertion failure is produced by a silent intermediate step
