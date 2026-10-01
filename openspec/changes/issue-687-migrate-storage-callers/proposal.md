## GitHub Issues

- #687
- #499

## Why

- Problem statement: The `lib/storage.ts` module is a "god object" that routes every database call for the entire application. The underlying implementations for session logs and campaign rolls have been split into `sessionLogRepo.ts` and `rollRepo.ts`, but callers still route through the monolithic facade.
- Why now: Epic #499 is tracking the systematic dismantling of this facade domain-by-domain to improve modularity and testability.
- Business/user impact: None visible to the user. This is a pure technical debt paydown that makes the codebase safer and easier to maintain.

## Problem Space

- Current behavior: Route handlers and tests import the global `storage` object to access session logs and campaign rolls. Test files mock the entire `storage` facade for isolated unit tests.
- Desired behavior: Route handlers import `sessionLogRepo` and `rollRepo` directly. Test files mock those specific repos instead of the global `storage`.
- Constraints: Must be purely mechanical, zero behavior change.
- Assumptions: The underlying implementations in the repos are completely stable and 100% equivalent to the facade methods.
- Edge cases considered: Test mocks that intercept multiple domains at once. (Exploration confirmed the mocks are cleanly isolated).

## Scope

### In Scope

- Replacing `import { storage }` with `import * as sessionLogRepo` and `import * as rollRepo` in the 4 impacted route handlers.
- Updating calls from `storage.<method>` to `<repo>.<method>` for `saveCampaignRoll`, `listCampaignRolls`, `loadSessionLogs`, `getNextSessionNumber`, `saveSessionLog`, `updateSessionLog`, and `deleteSessionLog`.
- Updating the 5 impacted unit test files to mock the narrow repos instead of the global `storage` facade.

### Out of Scope

- Any changes to `sessionLogRepo.ts` or `rollRepo.ts` internals.
- Refactoring other domains exposed by `storage.ts` (e.g. encounters, characters, parties).
- Any behavioral changes to the route handlers.

## What Changes

- `app/api/campaigns/[id]/sessions/route.ts`
- `app/api/campaigns/[id]/sessions/[sessionId]/route.ts`
- `app/api/campaigns/[id]/sessions/active/route.ts`
- `app/api/campaigns/[id]/rolls/route.ts`
- `tests/unit/api/campaigns/[id]/rolls.route.test.ts`
- `tests/unit/api/campaigns/sessions.route.test.ts`
- `tests/unit/api/campaigns/sessions.id.route.test.ts`
- `tests/unit/api/campaigns/[id]/sessions/active.route.test.ts`
- `tests/unit/storage/sessionLog.test.ts`

## Risks

- Risk: Broken test mocks
  - Impact: CI will fail if a mock doesn't properly intercept the repo module, causing tests to either fail or accidentally hit the database.
  - Mitigation: Ensure `jest.mock("@/lib/storage/<repo>")` replaces `jest.mock("@/lib/storage")` exactly where needed. The `rollRepo` tests already have an existing pattern for this via `membershipRepo`.

## Open Questions

- There are no open questions. The requirements and problem space are thoroughly defined.

## Non-Goals

- Eliminating `lib/storage.ts` entirely (other domains still exist).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
