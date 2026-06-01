## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED User search endpoint

The system SHALL expose `GET /api/users/search?q=<prefix>` returning a list of `{ id, username }` pairs for authenticated users.

#### Scenario: Successful prefix search

- **Given** a user is authenticated and other users with usernames exist in the database
- **When** `GET /api/users/search?q=dou` is requested
- **Then** the response is 200 with `{ results: [{ id: string, username: string }, ...] }` containing only users whose username starts with "dou" (case-insensitive), up to 15 results

#### Scenario: No matches

- **Given** a user is authenticated
- **When** `GET /api/users/search?q=zzznomatch` is requested
- **Then** the response is 200 with `{ results: [] }`

#### Scenario: Single character query

- **Given** a user is authenticated and users exist
- **When** `GET /api/users/search?q=a` is requested
- **Then** the response is 200 with results containing users whose username starts with "a"

#### Scenario: Result cap at 15

- **Given** a user is authenticated and 20+ users have usernames beginning with "test"
- **When** `GET /api/users/search?q=test` is requested
- **Then** the response is 200 with exactly 15 results

### Requirement: ADDED Self-exclusion from search results

The system SHALL never include the authenticated caller in their own search results.

#### Scenario: Caller matches search prefix

- **Given** a user with username "dougis" is authenticated
- **When** `GET /api/users/search?q=doug` is requested
- **Then** the response does not include an entry with the caller's own `id`

### Requirement: ADDED Input validation

The system SHALL reject requests with missing or out-of-range `q` parameters with HTTP 400.

#### Scenario: Missing q parameter

- **Given** a user is authenticated
- **When** `GET /api/users/search` is requested (no `q` parameter)
- **Then** the response is 400

#### Scenario: Empty q parameter

- **Given** a user is authenticated
- **When** `GET /api/users/search?q=` is requested
- **Then** the response is 400

#### Scenario: q exceeds maximum length

- **Given** a user is authenticated
- **When** `GET /api/users/search?q=<51-character-string>` is requested
- **Then** the response is 400

#### Scenario: q at maximum length (boundary)

- **Given** a user is authenticated
- **When** `GET /api/users/search?q=<50-character-string>` is requested
- **Then** the response is 200 (valid request)

### Requirement: ADDED PII safety

The system SHALL never return email, passwordHash, tokenVersion, isAdmin, or any field other than `id` and `username` in search results.

#### Scenario: Response shape enforcement

- **Given** a user is authenticated and search returns results
- **When** `GET /api/users/search?q=<prefix>` is requested
- **Then** each result object contains only `id` and `username` keys; no other fields are present

### Requirement: ADDED Rate limiting on search endpoint

The system SHALL enforce a rate limit of 20 requests per minute per authenticated user, returning HTTP 429 on excess.

#### Scenario: Under rate limit

- **Given** a user is authenticated
- **When** fewer than 20 search requests are made within a 60-second window
- **Then** all responses are 200

#### Scenario: Rate limit exceeded

- **Given** a user is authenticated
- **When** the 21st search request is made within the same 60-second window
- **Then** the response is 429

### Requirement: ADDED Unauthenticated access denied

The system SHALL return HTTP 401 for requests without a valid session token.

#### Scenario: No auth token

- **Given** no authenticated session
- **When** `GET /api/users/search?q=test` is requested
- **Then** the response is 401

## MODIFIED Requirements

None — this is a net-new capability with no changes to existing behavior.

## REMOVED Requirements

None.

## Traceability

- Proposal: "Authenticated access only" → Requirement: Unauthenticated access denied
- Proposal: "Prefix search via MongoDB regex" → Requirement: User search endpoint (successful prefix search)
- Proposal: "Rate limit 20 req/min per userId" → Requirement: Rate limiting on search endpoint
- Proposal: "`q` required, length 1–50" → Requirement: Input validation
- Proposal: "Regex injection prevention" → Non-functional: Security
- Proposal: "`{ id, username }` response, max 15, caller excluded" → Requirements: PII safety, Self-exclusion, Result cap
- Design Decision 1 (withAuth) → Requirement: Unauthenticated access denied → Task: implement route with withAuth
- Design Decision 2 (prefix regex) → Requirement: User search endpoint → Task: implement DB query
- Design Decision 3 (rate limit key) → Requirement: Rate limiting → Task: add checkRateLimit call
- Design Decision 4 (input validation) → Requirement: Input validation → Task: validate q parameter
- Design Decision 5 (regex escaping) → Non-functional: Security → Task: escape q before regex use
- Design Decision 6 (result shape + cap) → Requirements: PII safety, Result cap → Task: projection + limit

## Non-Functional Acceptance Criteria

### Requirement: Security — Regex injection prevention

#### Scenario: Metacharacter in query

- **Given** a user is authenticated
- **When** `GET /api/users/search?q=.*` or `q=(test` is requested
- **Then** the response is 200 with results matching only literal usernames containing those characters (not a wildcard match); no server error

### Requirement: Security — Access control

See "Unauthenticated access denied" above.

### Requirement: Reliability — Graceful empty state

See "No matches" scenario under "User search endpoint" above.
