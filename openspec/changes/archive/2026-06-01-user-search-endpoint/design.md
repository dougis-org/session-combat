## Context

- Relevant architecture: Next.js App Router API routes under `app/api/`. Auth via `withAuth` middleware (`lib/middleware.ts`). Rate limiting via `lib/rate-limit.ts` (in-memory, per-key). MongoDB accessed via `lib/db.ts` (`getDatabase()`). User type defined in `lib/types.ts`.
- Dependencies: 1a complete — `username` field exists on all users; sparse unique index on `users.username` in MongoDB.
- Interfaces/contracts touched: New route `app/api/users/search/route.ts` (no changes to existing files).

## Goals / Non-Goals

### Goals

- Authenticated prefix-search for users by username
- Minimal PII exposure (id + username only)
- Rate-limited to 20 req/min per authenticated user
- Input sanitized against regex injection
- Caller excluded from own results

### Non-Goals

- Fuzzy search
- Pagination
- Unauthenticated access
- Any UI implementation

## Decisions

### Decision 1: Authentication approach

- Chosen: `withAuth` wrapper — same pattern as all other protected routes
- Alternatives considered: API key header, session cookie only
- Rationale: Consistent with project conventions; provides `auth.userId` for rate-limit key and result exclusion
- Trade-offs: Requires a valid session token; no guest search possible (intentional)

### Decision 2: Search strategy — prefix regex vs fuse.js

- Chosen: MongoDB `$regex: /^\<escaped-q\>/i` anchored prefix query
- Alternatives considered: Load all users into memory → fuse.js fuzzy search
- Rationale: Uses the sparse unique index from 1a; O(log n) at the DB level; no memory bloat; invite flow needs exact-prefix behavior not typo tolerance
- Trade-offs: No fuzzy matching; slight complexity around regex escaping

### Decision 3: Rate-limit key

- Chosen: `search:user:<userId>` as the rate-limit key (20 req/min, 60 s window)
- Alternatives considered: IP address; bare `auth.userId`
- Rationale: IP is unreliable (NAT, proxies); userId ties the limit to the authenticated actor; namespaced key (`search:user:`) scopes the limit to this endpoint and prevents accidental coupling with other routes that may also rate-limit by userId
- Trade-offs: Per-user limit resets on cold start (existing known limitation)

### Decision 4: Input validation

- Chosen: `q` must be present, length 1–50 chars; return 400 otherwise
- Alternatives considered: Silently return empty array for missing `q`
- Rationale: Explicit errors are easier to debug from client; min 1 prevents missing-param confusion; max 50 prevents regex pathology
- Trade-offs: Slightly stricter API contract; documented in spec

### Decision 5: Regex injection mitigation

- Chosen: Escape special regex characters in `q` before use: replace `/[.*+?^${}()|[\]\\]/g` with `\\$&`
- Alternatives considered: Allowlist charset (alphanumeric + `_` + `-`); usernames already constrained by validation from 1b, but input sanitization is defence-in-depth
- Rationale: Safe regardless of upstream validation; zero overhead
- Trade-offs: None

### Decision 6: Result shape and cap

- Chosen: `{ results: Array<{ id: string; username: string }> }`, max 15 results
- Alternatives considered: Flat array; including `createdAt` for tie-breaking display
- Rationale: Envelope allows future metadata addition without breaking clients; 15 is enough for a picker dropdown; keeps payload small
- Trade-offs: Envelope adds one nesting level

## Proposal to Design Mapping

- Proposal element: Authenticated access only
  - Design decision: Decision 1 (withAuth)
  - Validation approach: Integration test with unauthenticated request → 401

- Proposal element: Prefix search via MongoDB regex
  - Design decision: Decision 2
  - Validation approach: Integration test with known usernames; assert partial prefix matches and non-matches

- Proposal element: Rate limit 20 req/min per userId
  - Design decision: Decision 3
  - Validation approach: Unit test calling checkRateLimit 21 times → 21st throws RateLimitError

- Proposal element: `q` required, length 1–50
  - Design decision: Decision 4
  - Validation approach: Unit tests for missing q, empty q, q.length > 50; all → 400

- Proposal element: Regex injection prevention
  - Design decision: Decision 5
  - Validation approach: Unit test with `q` containing regex metacharacters; assert escaped pattern

- Proposal element: `{ id, username }` response, max 15, caller excluded
  - Design decision: Decision 6
  - Validation approach: Integration test asserting response shape; assert caller not in results

## Functional Requirements Mapping

- Requirement: Return matching users by username prefix
  - Design element: MongoDB `$regex: /^\<q\>/i` with limit 15
  - Acceptance criteria reference: specs/search.md — successful search
  - Testability notes: Integration test with seeded users; assert matches and non-matches

- Requirement: Never return PII fields
  - Design element: MongoDB projection `{ username: 1 }` only; map to `{ id, username }`
  - Acceptance criteria reference: specs/search.md — PII safety
  - Testability notes: Assert response objects have no keys beyond `id` and `username`

- Requirement: Caller excluded from results
  - Design element: `{ _id: { $ne: new ObjectId(auth.userId) } }` in query
  - Acceptance criteria reference: specs/search.md — self-exclusion
  - Testability notes: Integration test where caller's username matches `q`; assert absent from results

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Rate-limited to prevent enumeration
  - Design element: `checkRateLimit(\`search:user:${auth.userId}\`, 20, 60_000)` at route entry
  - Acceptance criteria reference: specs/search.md — rate limit
  - Testability notes: Unit test driving rate limiter to limit; assert 429 response

- Requirement category: security
  - Requirement: Regex injection prevention
  - Design element: Escape `q` before use in regex
  - Acceptance criteria reference: specs/search.md — input validation
  - Testability notes: Unit test with metacharacter input; assert no unintended match expansion

- Requirement category: reliability
  - Requirement: Graceful handling of missing/invalid input
  - Design element: Validate `q` at route start; return 400 before DB query
  - Acceptance criteria reference: specs/search.md — input validation
  - Testability notes: Unit tests for all invalid input forms

## Risks / Trade-offs

- Risk/trade-off: In-memory rate limit resets on cold start (Fly.io stop/start)
  - Impact: Burst beyond 20 req/min possible across cold starts
  - Mitigation: Documented limitation in `lib/rate-limit.ts`; acceptable at current scale; Redis path documented for future

- Risk/trade-off: Anchored prefix regex is case-insensitive collation-dependent
  - Impact: MongoDB default collation is case-sensitive for regex; `/i` flag handles this explicitly
  - Mitigation: Always use `/i` flag; covered by test with mixed-case input

## Rollback / Mitigation

- Rollback trigger: Route causes unintended data exposure or production errors
- Rollback steps: Delete or gate `app/api/users/search/route.ts`; no DB schema changes to reverse
- Data migration considerations: None — read-only endpoint
- Verification after rollback: 404 on `GET /api/users/search`

## Operational Blocking Policy

- If CI checks fail: Do not merge; fix failing tests or type errors before proceeding
- If security checks fail: Treat as blocker; address regex escaping or PII leakage before merge
- If required reviews are blocked/stale: Re-request review; do not merge without approval
- Escalation path and timeout: If review stale >48 h, ping reviewer in PR thread

## Open Questions

No open questions — all design decisions confirmed during exploration phase.
