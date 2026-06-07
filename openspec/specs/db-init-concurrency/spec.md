## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED connectToDatabase initialises the database exactly once per process

The system SHALL ensure that `initializeDatabase` is called at most once per process lifetime, regardless of how many concurrent calls to `connectToDatabase` are made before the first call completes.

#### Scenario: Concurrent callers share one initialisation

- **Given** the module-level `cachedClient` and `cachedDb` are both `null` (server just started)
- **When** two or more requests call `connectToDatabase` concurrently before any of them has set the cache
- **Then** `initializeDatabase` is invoked exactly once, and all callers receive the same resolved `{ client, db }` result

#### Scenario: Subsequent callers after initialisation use the cache

- **Given** `cachedClient` and `cachedDb` are already set (initialisation completed)
- **When** any subsequent call to `connectToDatabase` is made
- **Then** the cached values are returned immediately without calling `initializeDatabase` again

#### Scenario: Failed connection allows retry

- **Given** the first call to `connectToDatabase` fails (e.g., MongoDB not reachable)
- **When** a subsequent call to `connectToDatabase` is made after the failure
- **Then** a new connection attempt is made (the failed promise is not reused), and the caller can successfully connect if MongoDB has become available

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element: `connectToDatabase` concurrent-call race -> Requirement: MODIFIED connectToDatabase initialises exactly once
- Design decision: Decision 1 (promise mutex) -> Requirement: MODIFIED connectToDatabase initialises exactly once
- Requirement -> Task(s): Task 1 in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** MongoDB is temporarily unavailable at server startup
- **When** the first `connectToDatabase` call rejects and MongoDB becomes available
- **Then** the next `connectToDatabase` call succeeds and the server resumes normal operation (the stale rejected promise does not permanently block subsequent attempts)
