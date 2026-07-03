## GitHub Issues

- #452

## Why

- **Problem statement:** `tests/unit/components/CampaignChat.test.tsx` has grown to 732 lines covering 50 test cases across many unrelated concerns (drawer visibility, stream events, history, unread badges, members, composer inputs, mentions dropdown, message sending, and scene composting). This makes it hard to scan, leads to high complexity, and increases the likelihood of merge conflicts.
- **Why now:** Decomposing this file into focused sub-suites makes the test code maintainable, improves developer velocity, and prevents merge conflicts as changes are introduced to the chat feature.
- **Business/user impact:** Faster development cycles and higher test codebase maintainability.

## Problem Space

- **Current behavior:** All 50 unit tests for `CampaignChat` reside in a single file `tests/unit/components/CampaignChat.test.tsx`, sharing a long list of test helpers and inline mock factories.
- **Desired behavior:** Test suites are split into focused, single-concern files under `tests/unit/components/CampaignChat/`. A shared `helpers.ts` exports common variables (like `CAMPAIGN_ID`), common mocks, and utility wrappers (`openDock()`, `fireMsg()`, `withMembers()`).
- **Constraints:** All 50 existing tests must pass unchanged (no logic changes, only file reorganization).
- **Assumptions:** Jest runs each test file in isolation, meaning hoisted `jest.mock` statements must be declared inside each file.
- **Edge cases considered:** Reference errors during Jest module mocking. Since `jest.mock` is hoisted to the top of the file, mock factories cannot refer to variables imported from `helpers.ts` at load-time. We defer import execution by dynamically loading `require('./helpers')` inside the mock factory.

## Scope

### In Scope

- Creation of `tests/unit/components/CampaignChat/helpers.ts` containing shared setups and wrappers.
- Splitting the 50 tests into 8 targeted test files matching specific concerns.
- Ensuring each new file contains a single top-level `describe('CampaignChat — <concern>')` block.
- Deletion of the original `tests/unit/components/CampaignChat.test.tsx` file once all tests are migrated.
- Verification that all unit tests (`npm run test:unit`) continue to pass.

### Out of Scope

- Changing the production logic of `CampaignChat` or any related component.
- Altering the assertion logic or behavior of the unit tests.
- Modifying E2E or integration tests.

## What Changes

- **Delete:** `tests/unit/components/CampaignChat.test.tsx`
- **Create:** `tests/unit/components/CampaignChat/` directory containing:
  - `helpers.ts` (shared test helpers and mocking setups)
  - `CampaignChat.drawer.test.tsx` (Pill open/close, Escape key, pin state, aria)
  - `CampaignChat.sse.test.tsx` (Stream events, heartbeat, duplicate dedup, session events)
  - `CampaignChat.history.test.tsx` (History fetch on expand, hasMore, cursor)
  - `CampaignChat.unread.test.tsx` (Unread badge increment/clear, LocalStore, error resilience)
  - `CampaignChat.members.test.tsx` (Members fetch, failure handling)
  - `CampaignChat.composer.test.tsx` (Composer state, mentions autocomplete, send/POST)
  - `CampaignChat.visibility.test.tsx` (Group/DM/whisper message filtering rendering)
  - `CampaignChat.scene.test.tsx` (Push Scene button, SceneComposer wiring, SceneFeedItem render)

## Risks

- **Risk:** Spawning multiple isolated test files increases Jest runner overhead.
  - **Impact:** Slightly longer unit test execution time.
  - **Mitigation:** Parallelization by Jest minimizes real-time wait impact.
- **Risk:** Jest hoisted mock reference errors.
  - **Impact:** Test runner fails to compile or run the tests.
  - **Mitigation:** Defer imports inside mock factories using `require('./helpers')`.

## Open Questions

There are no unresolved questions or design ambiguities. The mapping of existing tests to their new files is 1:1, preserving all current assertions.

## Non-Goals

- Refactoring or rewriting the production implementation of `CampaignChat.tsx`.
- Modifying integration or E2E tests.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
