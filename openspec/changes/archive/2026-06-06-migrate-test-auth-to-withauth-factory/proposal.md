## GitHub Issues

- #340

## Why

- **Problem statement:** 23 unit test files mock `requireAuth` via `jest.mock("@/lib/middleware")` auto-mock, but the routes they test invoke `withAuth` (or `withAuthAndParams`). Since `withAuth` is auto-mocked to a plain `jest.fn()`, it returns `undefined` rather than calling the handler — meaning business logic never runs, and 401 tests pass by accident rather than by actual auth rejection logic.
- **Why now:** `requireAuth` is already marked `@deprecated` in `lib/middleware.ts`. Leaving these tests in place propagates the deprecated pattern and gives false confidence in auth coverage.
- **Business/user impact:** Silent test gap — route tests appear green but do not exercise the handler at all when `withAuth` is the entry point. Any regression in the `withAuth`→handler wiring would go undetected.

## Problem Space

- **Current behavior:** `jest.mock("@/lib/middleware")` auto-mocks all exports. Tests configure `mockedRequireAuth` but `withAuth` is a no-op `jest.fn()`. Route handlers never execute during tests.
- **Desired behavior:** Tests explicitly mock `withAuth` and `withAuthAndParams` as pass-through factories. Handlers execute with a known `AuthPayload`. Auth rejection behavior is tested exclusively in `middleware.test.ts`.
- **Constraints:** Must not require changes to application code — this is a test-only migration.
- **Assumptions:** `middleware.test.ts` already provides full coverage of `withAuth`'s auth logic (tokenVersion DB check, 401/503 branches). Confirmed during exploration.
- **Edge cases considered:** `withAuthAndParams` routes need the factory to forward `params` correctly. One file (`characterImportRoute.test.ts`) uses a hybrid pattern that also needs updating.

## Scope

### In Scope

- `tests/unit/helpers/route.test.helpers.ts` — remove `itReturns401`, `itReturns401WithParams`, `mockUnauthorized`; drop `mockedRequireAuth` param from `itReturns500`, `itReturns500WithParams`, `itReturns404WithParams`
- All 23 affected test files listed in issue #340 — replace auto-mock with `withAuth`/`withAuthAndParams` factory, remove `requireAuth` imports and mocks, remove `itReturns401` call sites, drop last arg from remaining helper calls

### Out of Scope

- Changes to application code (`lib/middleware.ts`, route handlers)
- Adding new tests to `middleware.test.ts` (stretch goal in issue — excluded here)
- Removing the deprecated `requireAuth` export itself
- Any test files not listed in issue #340

## What Changes

- `tests/unit/helpers/route.test.helpers.ts`: remove 3 helpers and their `mockedRequireAuth` dependency; update 3 helpers to drop the now-unnecessary param
- 23 unit test files: replace `jest.mock("@/lib/middleware")` auto-mock with explicit factory; remove `requireAuth` import and `jest.mocked` reference; remove `itReturns401`/`itReturns401WithParams` call sites; update remaining helper call sites to drop the last arg

## Risks

- **Risk:** A test file uses `requireAuth` for something other than the standard 401 path.
  - **Impact:** That file would need a non-standard factory or separate test structure.
  - **Mitigation:** Grep confirms all 23 files follow the same auto-mock pattern. `characterImportRoute.test.ts` already partially uses the correct pattern.

- **Risk:** Removing `itReturns401` call sites reduces visible test count, which could look like a coverage drop.
  - **Impact:** Cosmetic — no real coverage lost since the old 401 tests were testing mock behavior, not route behavior.
  - **Mitigation:** PR description and commit message will explain the removal clearly.

## Open Questions

No unresolved ambiguity. Scope and approach confirmed during explore session:
- 401 tests dropped from route files (user confirmed: auth is middleware's responsibility)
- Factory mock pattern to use confirmed (matches `tests/unit/api/users/search/route.unit.test.ts`)
- `mockAdminDenied` kept in helpers (admin route tests use a different auth layer)

## Non-Goals

- Adding 503 branch coverage to `middleware.test.ts` (mentioned as optional stretch in #340 — not part of this change)
- Removing the `requireAuth` function from the codebase
- Changing how `middleware.test.ts` works

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
