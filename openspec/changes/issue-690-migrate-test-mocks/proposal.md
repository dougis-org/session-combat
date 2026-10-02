## GitHub Issues

- #690
- #831
- #832
- #833
- #834
- #499

## Why

- Problem statement: 10 unit test files still `jest.mock('@/lib/storage')`, mocking the monolithic `storage` facade. The 12 route handlers they cover still import the facade too, so the mocks cannot move to narrow repos until the routes do.
- Why now: Epic #499 is dismantling the `lib/storage.ts` god object domain-by-domain. These are the last facade importers in `app/`; finishing them unblocks removing the facade.
- Business/user impact: None user-visible. Tech-debt paydown; narrow-repo mocks fail loudly if a route calls the wrong repo, which facade mocks cannot catch.

## Problem Space

- Current behavior: 12 route files import `{ storage }` from `@/lib/storage`; 10 tests mock it wholesale.
- Desired behavior: routes import narrow repos (`import * as xRepo from '@/lib/storage/xRepo'`); tests `jest.mock('@/lib/storage/xRepo')`.
- Constraints: purely mechanical, zero behavior change. Each domain ships as its own PR (one sub-issue each) under parent #690.
- Assumptions (verified): every facade method used by these routes is a one-line delegation to a narrow-repo export of the same name and signature, so no logic moves. `userPreferences` is aliased directly to the repo functions.
- Edge cases considered: `app/api/campaigns/[id]/route.ts` imports `storage` but never uses it (it already uses `campaignRepo`) — dead import, remove. `app/api/me/preferences/route.ts` has no facade-mocking unit test; it is covered by `tests/integration/api/mePreferences.test.ts`.

## Scope

### In Scope

Four batches, one sub-issue and one PR each, worked sequentially:

| Batch | Sub-issue | Repo | Routes | Tests re-mocked |
|---|---|---|---|---|
| 1 Saved content | #831 | `savedContentRepo` | `content`, `content/[id]` | `content/route.test.ts`, `content/id.route.test.ts` |
| 2 Shares/members | #832 | `shareRepo` | `campaigns/[id]/characters`, `characters/[cid]`, `members/[userId]` | 3 tests under `tests/unit/api/campaigns/[id]/` |
| 3 Campaign templates | #833 | `campaignTemplateRepo` | `campaigns/global`, `global/[id]`, `global/[id]/copy` | `global.route`, `global.id.route`, `global.id.copy.route` tests |
| 4 Misc | #834 | `conditionCatalogRepo`, `encounterRepo`, `userPreferencesRepo` | `conditions/catalog`, `campaigns/[id]/encounters/[encounterId]`, `me/preferences`, dead import in `campaigns/[id]` | `conditions/catalog/route.test.ts`, `encounters/[encounterId]/route.test.ts` |

### Out of Scope

- Changes to repo internals or to `lib/storage.ts` itself (facade removal is tracked separately; #691 covers inline methods).
- Tests that import `storage` to exercise it for real (`tests/unit/lib/storage*`, `tests/unit/storage/*`, `tests/integration/*`) and `facadeShape.test.ts`.
- Any behavior change in routes.

## What Changes

- 12 route files under `app/api/` (see table) — import swap and call-site rename only.
- 10 unit test files — `jest.mock` target and mocked-method references.

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
