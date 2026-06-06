## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED `itReturns500` signature

The system SHALL call `itReturns500(handler, makeReq, setupError, description?)` without a `mockedRequireAuth` parameter.

#### Scenario: 500 test registers and passes

- **Given** a route handler wrapped by the `withAuth` factory mock
- **When** `itReturns500(handler, makeReq, setupError)` is called inside a `describe` block
- **Then** a test named "returns 500 on error" (or the provided description) is registered and passes when the storage/db mock throws

### Requirement: MODIFIED `itReturns500WithParams` signature

The system SHALL call `itReturns500WithParams(handler, makeReq, params, setupError, description?)` without a `mockedRequireAuth` parameter.

#### Scenario: 500-with-params test registers and passes

- **Given** a parameterized route handler wrapped by the `withAuthAndParams` factory mock
- **When** `itReturns500WithParams(handler, makeReq, params, setupError)` is called
- **Then** the test registers, the handler is invoked with the resolved params, and returns 500 when the error mock is active

### Requirement: MODIFIED `itReturns404WithParams` signature

The system SHALL call `itReturns404WithParams(handler, makeReq, params, setupNotFound, description?)` without a `mockedRequireAuth` parameter.

#### Scenario: 404-with-params test registers and passes

- **Given** a parameterized route handler wrapped by the `withAuthAndParams` factory mock
- **When** `itReturns404WithParams(handler, makeReq, params, setupNotFound)` is called
- **Then** the test registers and returns 404 when the not-found mock is active

## REMOVED Requirements

### Requirement: REMOVED `itReturns401`

Reason for removal: Route unit tests must not test auth rejection. `withAuth` is a factory mock that always passes auth through. Auth rejection behavior is fully specified and tested in `tests/unit/lib/middleware.test.ts`.

### Requirement: REMOVED `itReturns401WithParams`

Reason for removal: Same as `itReturns401`. No route test needs to simulate an unauthenticated request through a mocked auth wrapper.

### Requirement: REMOVED `mockUnauthorized`

Reason for removal: Only used by the deleted 401 helpers. No remaining consumers.

## Traceability

- Proposal element "drop 401 tests" → Requirement: REMOVED `itReturns401`, REMOVED `itReturns401WithParams`, REMOVED `mockUnauthorized`
- Design decision 2 (delete 401 helpers) → REMOVED requirements above
- Design decision 3 (drop mockedRequireAuth param) → MODIFIED `itReturns500`, `itReturns500WithParams`, `itReturns404WithParams`
- MODIFIED requirements → Task: update-test-helpers

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: TypeScript compilation clean after helper signature change

- **Given** the updated `route.test.helpers.ts` with removed params
- **When** `npx tsc --noEmit` is run
- **Then** zero type errors related to helper call sites (all 23 files updated in same change)
