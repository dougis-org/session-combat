## GitHub Issues

- #690
- #831
- #832 (closed, already done)
- #833 (closed, already done)
- #834
- #499

## Why

- Problem statement: unit tests still `jest.mock('@/lib/storage')`, mocking the monolithic `storage` facade, and the route handlers they cover still import it. At origin/main 49e58042 only 5 routes and 4 tests remain (the shares and templates batches, #832/#833, were already completed by #828 under #689 and were closed).
- Why now: Epic #499 is dismantling the `lib/storage.ts` god object domain-by-domain. These are the last facade importers in `app/`; finishing them unblocks removing the facade.
- Business/user impact: None user-visible. Tech-debt paydown; narrow-repo mocks fail loudly if a route calls the wrong repo, which facade mocks cannot catch.

## Problem Space

- Current behavior (at origin/main 49e58042): 5 route files import `{ storage }` from `@/lib/storage`; 4 tests mock it wholesale. (Originally scoped at 12 routes / 10 tests before #828 completed the shares and templates batches.)
- Desired behavior: routes import narrow repos (`import * as xRepo from '@/lib/storage/xRepo'`); tests `jest.mock('@/lib/storage/xRepo')`.
- Constraints: mechanical, zero behavior change, except the owner-approved validation added to the content routes in batch 1 (#831). Each domain ships as its own PR (one sub-issue each) under parent #690.
- Assumptions (verified): every facade method used by these routes is a one-line delegation to a narrow-repo export of the same name and signature, so no logic moves. `userPreferences` is aliased directly to the repo functions.
- Edge cases considered: `app/api/campaigns/[id]/route.ts` imports `storage` but never uses it (it already uses `campaignRepo`) — dead import, remove. `app/api/me/preferences/route.ts` has no facade-mocking unit test; it is covered by `tests/integration/api/mePreferences.test.ts`.

## Scope

### In Scope

Four batches, one sub-issue and one PR each, worked sequentially:

| Batch | Sub-issue | Repo | Routes | Tests re-mocked |
|---|---|---|---|---|
| 1 Saved content | #831 | `savedContentRepo` | `content`, `content/[id]` | `content/route.test.ts`, `content/id.route.test.ts` |
| ~~2 Shares/members~~ | #832 | `shareRepo` | already done by #828; closed | — |
| ~~3 Campaign templates~~ | #833 | `campaignTemplateRepo` | already done by #828; closed | — |
| 4 Misc | #834 | `conditionCatalogRepo`, `encounterRepo`, `userPreferencesRepo` | `conditions/catalog`, `campaigns/[id]/encounters/[encounterId]`, dead import in `campaigns/[id]` (`me/preferences` already migrated) | `conditions/catalog/route.test.ts`, `encounters/[encounterId]/route.test.ts` |

### Scope expansion (batch 1, #831)

Verity pre-commit findings (critical: whitespace-only `campaignId` reaches the repo; high: GET/POST/PUT/DELETE bypass `lib/validation/`) were accepted by the owner as in-scope for #831. Batch 1 therefore also adds input validation to the content routes with tests. This is the one intentional behavior change (invalid input now returns 400). Other batches remain zero-behavior-change.

### Out of Scope

- Changes to repo internals or to `lib/storage.ts` itself (facade removal is tracked separately; #691 covers inline methods).
- Tests that import `storage` to exercise it for real (`tests/unit/lib/storage*`, `tests/unit/storage/*`, `tests/integration/*`) and `facadeShape.test.ts`.
- Any behavior change in routes, except the batch-1 content-route validation described under "Scope expansion" above (now in scope).

## What Changes

- 5 route files under `app/api/` (see table) — import swap and call-site rename; plus validation in the 2 content routes.
- 4 unit test files — `jest.mock` target and mocked-method references; new validation tests for content.

## Risks

- Risk: a mock path is wrong and the test hits the real DB or fails on unmocked functions.
  - Impact: CI failure or flaky tests.
  - Mitigation: run each test file before/after the change; `npm run test:unit` per batch.
- Risk: a test mocks several domains through the one facade mock.
  - Impact: splitting into multiple `jest.mock` calls omits a method.
  - Mitigation: grep each test for every `storage.*` reference and map to its repo.

## Open Questions

- None.

## Non-Goals

- Deleting `lib/storage.ts` or reducing its surface.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
