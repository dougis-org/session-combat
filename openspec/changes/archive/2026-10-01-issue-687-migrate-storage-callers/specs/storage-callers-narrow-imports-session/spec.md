## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

*(No new functional features are being added. This is a technical debt payload.)*

## MODIFIED Requirements

### Requirement: MODIFIED Session Log and Roll Repo Caller Imports

The system SHALL use direct repository module imports (`sessionLogRepo` and `rollRepo`) instead of the god-object `storage` facade for the 4 identified session and roll route handlers.

#### Scenario: Route Handlers directly call narrow repos

- **Given** an API request to any of the 4 impacted route handlers (e.g. `POST /api/campaigns/[id]/rolls`)
- **When** the route handler processes the request
- **Then** the database operations are performed via `rollRepo.*` or `sessionLogRepo.*` methods (instead of `storage.*`)
- **And** the behavior and response remains 100% identical to the previous implementation

## REMOVED Requirements

### Requirement: REMOVED God-Object Storage Dependency in Session/Roll Routes

Reason for removal: The `storage.ts` facade is being systematically dismantled (Epic #499) to improve code modularity and testing isolation.

## Traceability

- Proposal element -> Requirement: Updating route handlers -> MODIFIED Session Log and Roll Repo Caller Imports
- Design decision -> Requirement: Decision 1 (Direct Module Imports) -> MODIFIED Session Log and Roll Repo Caller Imports
- Requirement -> Task(s): Task 2.1, Task 2.2

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Operability

#### Scenario: Test Suite Isolation

- **Given** the test suite executes (`npm run test:unit`)
- **When** tests for the 4 route handlers and `storage.ts` run
- **Then** all 5 test files intercept the correct isolated repo dependencies (`sessionLogRepo` or `rollRepo`) using `jest.mock()`
- **And** no test accidentally leaks to the real database due to an incorrect mock path
