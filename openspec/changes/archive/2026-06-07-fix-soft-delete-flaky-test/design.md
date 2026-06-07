## Context

- **Relevant architecture:**
  - `lib/db.ts` — singleton MongoDB connection module. `connectToDatabase()` maintains module-level `cachedClient`/`cachedDb`. `initializeDatabase()` creates the `characters_active` view and indexes on first connection.
  - `lib/storage.ts` — storage abstraction. `loadCharacters` queries `characters_active` with fallback to direct collection. `deleteCharacter` uses `updateOne` on the raw `characters` collection.
  - `tests/integration/characters/softDelete.integration.test.ts` — integration tests running against a live Next.js + MongoDB stack started in `globalSetup`.
- **Dependencies:** MongoDB driver (`mongodb`), Next.js, Jest test runner with `maxWorkers: '50%'` for integration tests.
- **Interfaces/contracts touched:**
  - `connectToDatabase()` — internal module function; no external API contract.
  - `deleteCharacter(id, userId)` — internal storage method; callers are `app/api/characters/[id]/route.ts` DELETE handler only.
  - `softDelete.integration.test.ts` — test file; no external contract.

## Goals / Non-Goals

### Goals

- Eliminate the concurrent `initializeDatabase` race by serialising `connectToDatabase` callers.
- Make `deleteCharacter` fail loudly when no document is matched.
- Make the 404 test self-diagnosing by asserting intermediate HTTP status codes.

### Non-Goals

- Altering the `characters_active` view pipeline or filter semantics.
- Changing error-path HTTP status codes for the character DELETE endpoint on the happy path.
- Fixing other storage methods with similar silent-failure patterns (out of scope for this change).

## Decisions

### Decision 1: Promise mutex for `connectToDatabase`

- **Chosen:** Store the in-flight initialisation in a module-level `connectionPromise: Promise<...> | null`. On first call, assign the promise; on subsequent concurrent calls, return the same promise. Clear `connectionPromise` (set to `null`) in the rejection handler so a failed attempt allows retry on the next call.
- **Alternatives considered:**
  - _Synchronous lock via boolean flag_: still allows a window where two callers read `false` before either sets `true` (not safe across async boundaries in Node.js event loop).
  - _Retry loop with backoff_: addresses flakiness at the caller level but doesn't fix the root race.
- **Rationale:** A shared promise is the idiomatic Node.js pattern for preventing concurrent async initialisation. Because `cachedDb` is only set after the promise resolves, the race is fully closed.
- **Trade-offs:** If the initial connection fails, the rejection is surfaced to all concurrent waiters (correct). Clearing `connectionPromise` on failure allows the next request to retry (desired for resilience, no downside).

### Decision 2: `matchedCount` guard in `deleteCharacter`

- **Chosen:** After `updateOne`, read `result.matchedCount`. If `=== 0`, throw `new Error(\`Character ${id} not found\`)`. The error propagates through the `try/catch` in `deleteCharacter` and will be caught by the DELETE route's outer handler, returning HTTP 500.
- **Alternatives considered:**
  - _Return a boolean_: changes the function signature; callers would need updates. More invasive than needed.
  - _No change, add logging only_: improves observability but doesn't make tests fail fast.
- **Rationale:** The DELETE route already performs an ownership check via `loadCharacters` before calling `deleteCharacter`. In the normal flow, `matchedCount === 0` is only reachable via a race or bug, so throwing is the right signal. It converts a silent no-op into a detectable error.
- **Trade-offs:** Any future callers that rely on the silent no-op behaviour will break. This is desirable — the silent no-op is a defect, not a feature.

### Decision 3: Explicit status assertions in the 404 test

- **Chosen:** Add `expect(createRes.status).toBe(201)` immediately after the create fetch, and `expect(deleteRes.status).toBe(200)` immediately after the delete fetch, in the "should return 404 when accessing deleted character detail" test.
- **Alternatives considered:**
  - _Retry loop on the final GET_: masks root cause; wrong approach.
  - _Add a `waitFor` helper_: unnecessary given the synchronous HTTP request/response model.
- **Rationale:** The test was silently continuing with bad state. Asserting each step turns an obscure end-of-test failure into an immediate, specific error pointing at the broken step.
- **Trade-offs:** None. This is a straightforward test quality improvement.

## Proposal to Design Mapping

- **Proposal element:** `connectToDatabase` concurrent-call race
  - **Design decision:** Decision 1 (promise mutex)
  - **Validation approach:** Covered by the existing integration test suite; the race is structural and doesn't require a new test.

- **Proposal element:** `deleteCharacter` silent failure on `matchedCount === 0`
  - **Design decision:** Decision 2 (`matchedCount` guard)
  - **Validation approach:** New unit test asserting that `deleteCharacter` throws when `updateOne` returns `matchedCount: 0`. See `tests.md`.

- **Proposal element:** 404 test missing intermediate assertions
  - **Design decision:** Decision 3 (explicit status assertions)
  - **Validation approach:** The test itself becomes the validation; a failure in create or delete now surfaces at the right line.

## Functional Requirements Mapping

- **Requirement:** `connectToDatabase` must only call `initializeDatabase` once per process lifetime, even under concurrent callers.
  - **Design element:** Decision 1 — promise mutex.
  - **Acceptance criteria reference:** `specs/db-init-concurrency/spec.md` — Scenario: concurrent callers share one initialisation.
  - **Testability notes:** Can be tested by calling `connectToDatabase` twice concurrently and asserting `initializeDatabase` (mocked) is called exactly once.

- **Requirement:** `deleteCharacter` must throw when the target document is not found.
  - **Design element:** Decision 2 — `matchedCount` guard.
  - **Acceptance criteria reference:** `specs/delete-character-not-found/spec.md` — Scenario: deleteCharacter throws on no match.
  - **Testability notes:** Unit test with mocked MongoDB collection returning `{ matchedCount: 0 }`.

- **Requirement:** The 404 integration test must assert each HTTP operation before proceeding.
  - **Design element:** Decision 3 — inline `expect` assertions.
  - **Acceptance criteria reference:** `specs/soft-delete-test-assertions/spec.md` — Scenario: intermediate steps asserted.
  - **Testability notes:** Verified by the test passing in CI without flaking.

## Non-Functional Requirements Mapping

- **Requirement category:** reliability
  - **Requirement:** CI integration test suite must not produce intermittent failures on the soft-delete path.
  - **Design element:** All three decisions together eliminate the known flake vectors.
  - **Acceptance criteria reference:** Green CI runs across multiple consecutive PR triggers.
  - **Testability notes:** Observe CI over 5+ PR runs after merge; zero recurrences.

- **Requirement category:** operability
  - **Requirement:** If `connectToDatabase` fails, the next request must be able to retry.
  - **Design element:** Decision 1 — clear `connectionPromise` on rejection.
  - **Acceptance criteria reference:** `specs/db-init-concurrency/spec.md` — Scenario: failed connection allows retry.
  - **Testability notes:** Unit test that simulates a failed first connect and verifies second attempt succeeds.

## Risks / Trade-offs

- **Risk/trade-off:** Throwing in `deleteCharacter` on `matchedCount === 0` turns a silent no-op into an HTTP 500 for an unexpected race.
  - **Impact:** An unexpected 500 is more visible than a silent 200. This is intentional. No user-visible 500 is expected in normal operation given the prior ownership check.
  - **Mitigation:** Confirm via code search that the DELETE route's pre-check ensures `matchedCount === 0` is unreachable in normal flow before shipping.

- **Risk/trade-off:** The promise mutex caches a rejected promise briefly until cleared.
  - **Impact:** All concurrent callers waiting on the same failed promise will receive the rejection. This is correct behaviour — they all get the error, not a stale connection.
  - **Mitigation:** Clear `connectionPromise` in the catch block; tested by the retry scenario in specs.

## Rollback / Mitigation

- **Rollback trigger:** New CI failures introduced by the `matchedCount` guard (i.e., a caller that legitimately expected the no-op behaviour).
- **Rollback steps:** Revert `lib/storage.ts` change only; `lib/db.ts` and test changes are safe to keep.
- **Data migration considerations:** None — no schema changes.
- **Verification after rollback:** Re-run integration test suite; confirm original flake rate returns to baseline (i.e., no new failures introduced).

## Operational Blocking Policy

- **If CI checks fail:** Investigate the failure before merge. Do not bypass with `--no-verify` or admin merge.
- **If security checks fail:** Treat as a blocker; escalate to the repo owner.
- **If required reviews are blocked/stale:** After 48 hours without review, ping the reviewer and/or re-assign.
- **Escalation path and timeout:** If CI is green but merge is blocked > 72 hours, escalate to the repository owner (dougis).

## Open Questions

No open questions remain.
