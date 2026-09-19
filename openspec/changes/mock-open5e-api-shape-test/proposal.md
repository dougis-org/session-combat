## GitHub Issues

- #162

## Why

- Problem statement: `tests/integration/api/open5eApiShape.test.ts` makes live network calls to `https://api.open5e.com` via a hand-rolled `fetchWithRetry` helper, instead of going through the project's shared `Open5EClient`. The whole file is currently wrapped in `describe.skip` (added in PR #533, "resolve flaky integration tests"), so it contributes zero value today: it neither runs in CI nor documents the API shape for anyone.
- Why now: issue #162 asks to stop the flakiness properly rather than leaving the tests permanently disabled, and its own text suggests moving this out of CI since the test's real purpose (documenting the live API's response shape) is undermined by mocking it.
- Business/user impact: none functionally — this is test-infrastructure hygiene. The payoff is a CI suite with no dead/skipped files and a usable manual check when the Open5E API shape needs to be re-verified (e.g., after upstream API changes).

## Problem Space

- Current behavior: two `describe.skip` blocks in `tests/integration/api/open5eApiShape.test.ts` define a local `fetchWithRetry(url, retries)` that calls raw `fetch` against `https://api.open5e.com/v2/...`, with manual timeout/retry/backoff logic duplicated from nothing else in the codebase. Because the blocks are skipped, Jest never executes them.
- Desired behavior: the live-shape check moves to a manual/adhoc script (not part of the Jest suite, not part of CI), and is rewritted to use `Open5EClient` from `lib/import/open5eAdapter.ts` — the same client `open5eAdapter.test.ts` and production import code use — instead of a bespoke `fetchWithRetry`.
- Constraints:
  - `Open5EClient` already retries transient failures internally (`fetchWithBackoff`, `lib/import/open5eAdapter.ts:74-106`: 3 retries with exponential backoff, 429-aware `Retry-After` handling); it only throws once retries are exhausted or on a non-ok response. The manual script does not need to add its own retry logic on top of this.
  - The script must not be picked up by Jest (`npm run test:unit`) or added to any CI workflow.
  - The script documents the raw wire shape (`key`, flat `armor_class`/`hit_points`, `desc`, etc.) — but `Open5EClient.fetchMonsters`/`fetchSpells` return data typed as `PaginatedResponse<Open5ECreature>`/`PaginatedResponse<Open5ESpell>`, which are the adapter's already-parsed types, not raw unprocessed JSON. Using the client means the shape assertions are effectively checking "does the API still satisfy the `Open5ECreature`/`Open5ESpell` TypeScript shape," which is a reasonable, arguably better, definition of "the API shape is what we expect" than the original raw-JSON property checks.
- Assumptions:
  - "Manual/adhoc script" means a standalone Node/TS script runnable via `npx tsx` or an `npm run` script, not a Jest test file — since a skipped-by-default Jest file is exactly today's unsatisfactory state.
  - No new automated CI job should be created for this script; it is triggered by a human when needed.
- Edge cases considered:
  - Open5E API being down or rate-limited when the script is run manually — script should fail loudly with a clear message, not silently pass.
  - Script accidentally being swept into `npm run test:unit` via a glob — must be placed/named so Jest's `testMatch`/`testPathIgnorePatterns` excludes it.

## Scope

### In Scope

- Remove `tests/integration/api/open5eApiShape.test.ts` from the Jest test tree (delete or relocate out of `tests/`).
- Create a manual/adhoc script (e.g. `scripts/check-open5e-api-shape.ts` or similar) that uses `Open5EClient` (or the exported `fetchMonsters`/`fetchSpells` convenience functions) to fetch one page of creatures and one page of spells and assert/report on their shape.
- Add an `npm run` script (or documented `npx tsx` invocation) to execute it on demand.
- Document, in the script header or `openspec/specs`, that this is a manual check, not part of CI, and why.

### Out of Scope

- Any change to `Open5EClient`, `open5eAdapter.ts`, or the adapter's transformation logic itself.
- Adding retry/backoff to `Open5EClient` for production use (only relevant if the manual script needs it and a decision is made to add it — see Open Questions).
- Re-enabling any live-network Jest test in CI.
- Changes to `tests/helpers/open5eTestHelpers.ts` mock fixtures (they remain adapter-shaped and are unaffected).

## What Changes

- `tests/integration/api/open5eApiShape.test.ts` is deleted from the Jest suite.
- A new manual script replaces it, using `Open5EClient` instead of raw `fetch`/`fetchWithRetry`.
- Package script / README note added so a human can run the shape check on demand.

## Risks

- Risk: Deleting the skipped test file loses the historical documentation of the raw API shape (property names like `key` vs `slug`) if the new script checks the adapter-parsed shape instead of the raw wire shape.
  - Impact: future readers lose a quick reference for "what does the raw Open5E v2 API actually return."
  - Mitigation: keep the shape assertions expressed against the `Open5ECreature`/`Open5ESpell` types (which are already the documented, intentional parsed shape) and note in the script's header comment what raw-API quirks the adapter accounts for (e.g., `key` not `slug`), rather than re-deriving raw JSON assertions.
- Risk: A manual script with no scheduled execution silently rots (Open5E changes shape, nobody runs the script, nobody notices).
  - Impact: low — this is strictly better than the current permanently-skipped state, but doesn't fully solve "detect API drift."
  - Mitigation: accept as a known limitation per issue #162's own suggestion; out of scope to add scheduled execution unless requested.

## Open Questions

None blocking — resolved in `design.md`:

- Script location/invocation: `lib/scripts/checkOpen5eApiShape.ts`, run via `npx tsx`, wired as `npm run check:open5e-api-shape` (matches the existing `lib/scripts/*.ts` convention — see design Decision 2), not `scripts/` (reserved for build/repo tooling).
- Retry/backoff: not added anywhere. The script fails fast on a single failed fetch rather than reimplementing the old `fetchWithRetry`, and `Open5EClient` itself is left untouched (design Decision 4).
- Connectivity vs. shape checks: both fold into the one manual script, since they exercise the same `Open5EClient` calls (design Decisions 3 and 5).

## Non-Goals

- Not attempting to add scheduled/automated re-verification of the live Open5E API shape.
- Not modifying `Open5EClient`'s production retry/error-handling behavior.
- Not touching the mocked unit tests in `tests/unit/import/open5eAdapter.test.ts` or `tests/helpers/open5eTestHelpers.ts`.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
