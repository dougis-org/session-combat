## ADDED Requirements

This document details changes to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Mock Auth State Helper

The system SHALL provide a central state object `mockAuthState` that allows changing the mock authentication state dynamically inside test blocks.

#### Scenario: Setting payload to a mock user allows authentication to pass

- **Given** `mockAuthState.payload` is configured to `MOCK_AUTH`
- **When** calling an API route wrapped with `withAuth` or `withAuthAndParams`
- **Then** the request passes authentication and executes the route's inner handler.

#### Scenario: Setting payload to null rejects request

- **Given** `mockAuthState.payload` is configured to `null`
- **When** calling an API route wrapped with `withAuth` or `withAuthAndParams`
- **Then** the request is rejected with a 401 Unauthorized status.

## MODIFIED Requirements

### Requirement: MODIFIED Shared Route Test Helper Assertions

The system SHALL assert route authentication behaviors by mutating `mockAuthState.payload` rather than configuring a direct mock of `requireAuth`.

#### Scenario: Asserting 401 unauthorized

- **Given** `itReturns401` or `itReturns401WithParams` is executed
- **When** the route handler is invoked within the assertion block
- **Then** `mockAuthState.payload` is set to `null` during the invocation, the status code is checked for `401`, and `mockAuthState.payload` is safely restored to `MOCK_AUTH` afterwards.

## REMOVED Requirements

### Requirement: REMOVED Direct Mocks of `requireAuth` in Unit Tests

Reason for removal: The `requireAuth` helper is deprecated, and mocking it directly bypasses the `withAuth` and `withAuthAndParams` wrappers, leading to a coverage gap. All unit tests must mock the wrappers at the boundary instead.

## Traceability

- Proposal element: Update 28 unit tests -> Requirement: ADDED Mock Auth State Helper, MODIFIED Shared Route Test Helper Assertions, REMOVED Direct Mocks of `requireAuth`
- Design decision: Decision 1 (State-Based Middleware Mock Factory) -> Requirement: ADDED Mock Auth State Helper
- Design decision: Decision 2 (Remove `requireAuth` Mocking and Imports) -> Requirement: REMOVED Direct Mocks of `requireAuth`
- Requirement -> Task(s): (Defined in tasks.md)

## Non-Functional Acceptance Criteria

### Requirement: Operability / Maintenance

#### Scenario: Clean imports and compilation

- **Given** all unit tests are compiled
- **When** checking for imports of `requireAuth` from `@/lib/middleware`
- **Then** no import statement exists in any unit test file, except `middleware.test.ts`.
