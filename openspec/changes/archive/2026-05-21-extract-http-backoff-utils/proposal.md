## GitHub Issues

- #158

## Why

- Problem statement: `fetchWithBackoff` in `lib/import/open5eAdapter.ts` mixes three distinct concerns — retry orchestration, backoff time calculation, and 429 rate-limit handling — in a single 43-line function. The backoff math is duplicated verbatim in two branches (429 path and error path). Neither the calculation nor the rate-limit logic is reusable by future provider adapters.
- Why now: Issue #158 was filed as part of the provider-agnostic architecture established in #155. As additional external API adapters are added, shared HTTP retry utilities must exist before those adapters are written, not after.
- Business/user impact: No user-visible change. Developer impact: future adapter authors have a clean, tested utility to call instead of re-implementing backoff math per adapter.

## Problem Space

- Current behavior: `fetchWithBackoff` validates the URL, loops over retries, calculates backoff inline (twice — once in the 429 branch using `Retry-After`, once in the catch block), sleeps, and propagates errors. The 10 000 ms cap is a magic number.
- Desired behavior: `fetchWithBackoff` is a pure orchestrator. Backoff math lives in `calculateBackoffMs`. 429 sleep-and-signal logic lives in `handleRateLimitResponse`. Both are exported from a new `lib/import/http-utils.ts` file, usable by any future provider adapter.
- Constraints: Existing tests must continue to pass without modification to test logic. No change to observable behaviour — same retry count, same backoff math, same cap.
- Assumptions: The 10 000 ms cap is intentionally different from `SyncQueue`'s 30 000 ms cap; they serve different contexts and should remain separate named constants.
- Edge cases considered: `Retry-After` header present vs absent; `attempt === retries` (last attempt, should not sleep on 429, should return response); catch branch on last attempt (should not sleep).

## Scope

### In Scope

- Create `lib/import/http-utils.ts` with `calculateBackoffMs`, `handleRateLimitResponse`, and `MAX_BACKOFF_MS`
- Refactor `fetchWithBackoff` in `lib/import/open5eAdapter.ts` to call those utilities
- Unit tests for `calculateBackoffMs` and `handleRateLimitResponse` in a new test file

### Out of Scope

- Changing retry count defaults or backoff parameters
- Migrating `SyncQueue.calculateRetryDelay` to share the new utility (different cap, different context)
- Any other provider adapters (DnD Beyond, etc.) — they will adopt `http-utils.ts` in their own changes
- Changes to `isAllowedUrl` or URL validation logic

## What Changes

- **New file**: `lib/import/http-utils.ts` — exports `MAX_BACKOFF_MS`, `calculateBackoffMs`, `handleRateLimitResponse`
- **Modified**: `lib/import/open5eAdapter.ts` — `fetchWithBackoff` delegates to utilities; magic number removed
- **New test file**: `tests/unit/import/http-utils.test.ts`

## Risks

- Risk: Behaviour regression in retry/backoff logic
  - Impact: External API calls may fail faster or slower than intended
  - Mitigation: Unit tests cover all branches (Retry-After present/absent, last-attempt boundary, catch path); existing open5eAdapter integration tests unchanged

## Open Questions

No unresolved ambiguity. All decisions confirmed during exploration:
- `calculateBackoffMs` signature: `(attempt: number, retryAfterHeader?: string | null): number`
- `handleRateLimitResponse` return: `Promise<boolean>` (true = retry, false = return response)
- Constant name: `MAX_BACKOFF_MS` (file-scoped, unambiguous within `http-utils.ts`)
- Placement: `lib/import/http-utils.ts` (provider-agnostic HTTP utilities, import layer)

## Non-Goals

- Unifying HTTP backoff with `SyncQueue` backoff
- Changing any external-facing API behaviour
- Adding new retry strategies or configurable caps

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
