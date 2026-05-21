## Context

- Relevant architecture: `lib/import/` contains provider adapter code (`open5eAdapter.ts`, future DnD Beyond adapters). Issue #155 established the pattern of separating generic utilities from provider-specific logic. `lib/offline/SyncQueue.ts` has its own `calculateRetryDelay` (30 000 ms cap) — intentionally separate context.
- Dependencies: No new runtime dependencies. `lib/import/http-utils.ts` has no imports beyond what the runtime provides (`fetch`, `Response` from global scope).
- Interfaces/contracts touched: `fetchWithBackoff` in `lib/import/open5eAdapter.ts` (internal, not exported). New exports: `calculateBackoffMs`, `handleRateLimitResponse` from `lib/import/http-utils.ts`.

## Goals / Non-Goals

### Goals

- Eliminate duplicated backoff math in `fetchWithBackoff`
- Make backoff calculation and 429 handling reusable across future provider adapters
- Name the magic `10000` constant
- Keep `fetchWithBackoff` as a readable orchestrator

### Non-Goals

- Changing retry behaviour, backoff math, or cap values
- Sharing backoff logic with `SyncQueue`
- Modifying any other adapter or import file

## Decisions

### D1: Create `lib/import/http-utils.ts` as the home for shared HTTP retry utilities

- Chosen: New file `lib/import/http-utils.ts` exports `MAX_BACKOFF_MS`, `calculateBackoffMs`, and `handleRateLimitResponse`
- Alternatives considered: (a) Inline helpers inside `open5eAdapter.ts` — not reusable; (b) `lib/utils/backoff.ts` at top level — too generic, mixes offline sync and HTTP concerns
- Rationale: Consistent with #155 pattern (generic utilities in `lib/import/`, provider adapters call them). Naming makes the scope unambiguous.
- Trade-offs: New file adds surface area; offset by being the designated home for future adapter HTTP utilities

### D2: `handleRateLimitResponse` returns `Promise<boolean>` (true = retry, false = return response)

- Chosen: Boolean return signals the orchestrator whether to `continue` the retry loop
- Alternatives considered: (a) Return a discriminated union `{ action: 'retry' } | { action: 'return', response }` — more explicit but verbose for a two-branch decision; (b) Leave 429 handling inline, extract only `calculateBackoffMs` — simpler but leaves the two business logic concerns in the orchestrator
- Rationale: Boolean is sufficient for two states; keeps the orchestrator one-liners clean (`if (await handleRateLimitResponse(...)) continue; return response;`). The function name makes the boolean semantics clear.
- Trade-offs: `true`/`false` is slightly less self-documenting than a discriminated union; mitigated by the named function and JSDoc if needed

### D3: `MAX_BACKOFF_MS = 10_000` as a file-scoped constant in `http-utils.ts`

- Chosen: Non-exported constant in `http-utils.ts`, value `10_000` (numeric separator for readability)
- Alternatives considered: (a) Export it for callers to override — not needed; no caller currently overrides the cap; (b) Keep magic number — defeats the purpose
- Rationale: File-scoped is sufficient; if a future adapter needs a different cap, it can pass a parameter or define its own constant
- Trade-offs: None significant

### D4: `calculateBackoffMs` signature `(attempt: number, retryAfterHeader?: string | null): number`

- Chosen: Optional `retryAfterHeader` param handles both Retry-After and pure exponential paths in one function
- Alternatives considered: Two separate functions — adds indirection without benefit since the branch is a single `if`
- Rationale: Single function mirrors the two backoff paths already present in `fetchWithBackoff`; callers pass `response.headers.get("Retry-After")` directly
- Trade-offs: Callers must know to pass `null`/`undefined` for the non-429 path; acceptable given the clear parameter name

## Proposal to Design Mapping

- Proposal element: Create `lib/import/http-utils.ts`
  - Design decision: D1
  - Validation approach: File exists, exports are importable, TypeScript compiles

- Proposal element: Extract `calculateBackoffMs`
  - Design decision: D4
  - Validation approach: Unit tests cover Retry-After present, Retry-After absent, cap boundary

- Proposal element: Extract `handleRateLimitResponse`
  - Design decision: D2
  - Validation approach: Unit tests cover last-attempt boundary (returns false), mid-attempt (sleeps, returns true)

- Proposal element: Name the magic `10000` constant
  - Design decision: D3
  - Validation approach: No literal `10000` or `10_000` appears in `open5eAdapter.ts` after refactor

- Proposal element: Keep `fetchWithBackoff` as orchestrator
  - Design decision: D1, D2
  - Validation approach: Function body contains no inline backoff math; existing adapter tests pass

## Functional Requirements Mapping

- Requirement: `calculateBackoffMs` returns correct ms for exponential case
  - Design element: D4 — `Math.min(1000 * Math.pow(2, attempt), MAX_BACKOFF_MS)`
  - Acceptance criteria reference: specs/http-utils/spec.md
  - Testability notes: Pure function; unit-testable with no mocks

- Requirement: `calculateBackoffMs` respects `Retry-After` header value
  - Design element: D4 — `Math.min(parseInt(retryAfterHeader, 10) * 1000, MAX_BACKOFF_MS)`
  - Acceptance criteria reference: specs/http-utils/spec.md
  - Testability notes: Pass string values including edge cases (`"0"`, `"10"`, `"11"` for over-cap)

- Requirement: `handleRateLimitResponse` sleeps and returns `true` when retries remain
  - Design element: D2
  - Acceptance criteria reference: specs/http-utils/spec.md
  - Testability notes: Mock `setTimeout`/`Promise`; assert return value and that sleep was called

- Requirement: `handleRateLimitResponse` returns `false` on last attempt without sleeping
  - Design element: D2
  - Acceptance criteria reference: specs/http-utils/spec.md
  - Testability notes: Assert no sleep called when `attempt === retries`

- Requirement: `fetchWithBackoff` behaviour unchanged end-to-end
  - Design element: D1 — orchestrator delegates, same logic path
  - Acceptance criteria reference: existing open5eAdapter tests
  - Testability notes: Existing tests must pass without modification

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No change to retry timing or failure semantics
  - Design element: All extracted functions preserve exact existing math
  - Acceptance criteria reference: specs/http-utils/spec.md boundary tests
  - Testability notes: Test cap boundary (`attempt` where `2^attempt * 1000 > 10000`)

- Requirement category: operability
  - Requirement: TypeScript compiles without errors
  - Design element: Proper types on all new functions
  - Acceptance criteria reference: `tsc --noEmit` in CI
  - Testability notes: CI gate

## Risks / Trade-offs

- Risk/trade-off: Behavioural regression from extraction
  - Impact: External API calls may retry with wrong timing
  - Mitigation: Unit tests pin exact output values; existing adapter tests unchanged and must pass

## Rollback / Mitigation

- Rollback trigger: CI failure or test regression after merge
- Rollback steps: Revert the PR; `fetchWithBackoff` is self-contained and can be restored to the pre-extraction version without affecting any other file
- Data migration considerations: None — pure code change, no state
- Verification after rollback: All tests pass on the reverted branch

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failure before proceeding.
- If security checks fail: Do not merge. Escalate to maintainer.
- If required reviews are blocked/stale: Ping reviewer after 48 hours; escalate to maintainer after 72 hours.
- Escalation path and timeout: Maintainer (doug@dougis.com) is the final escalation. No auto-merge under any blocking condition.

## Open Questions

No open questions. All design decisions were resolved during exploration prior to proposal creation.
