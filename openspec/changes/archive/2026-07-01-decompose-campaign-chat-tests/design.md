## Context

- **Relevant architecture:** Unit test files located in `tests/unit/components/` testing the `CampaignChat` component.
- **Dependencies:** Jest, React Testing Library, User Event, and mocks for LocalStore, useCampaignStream, useAuth.
- **Interfaces/contracts touched:** Unit testing environment only; no production interfaces/contracts are modified.

## Goals / Non-Goals

### Goals

- Split `tests/unit/components/CampaignChat.test.tsx` into 8 separate test suites matching specific concerns plus a shared `helpers.ts`.
- Ensure all 50 tests pass unchanged.
- Minimize duplication of test setup, fetch mocks, and wrappers by centralizing them in `helpers.ts`.

### Non-Goals

- Refactoring any production code.
- Adding new test cases or changing existing test assertions.

## Decisions

### Decision 1: Centralized helpers.ts File

- **Chosen:** A single shared utility file `tests/unit/components/CampaignChat/helpers.ts` that exports:
  - `CAMPAIGN_ID`
  - `sharedTestState` (for capturing variables like `capturedOnEvent` or `fetchSpy` to share them with wrappers)
  - `setupFetchMock(overrides)` and `restoreFetch()`
  - `openDock()`, `fireMsg()`, `withMembers()`
- **Alternatives considered:** Duplicating setup helpers in each sub-suite file.
- **Rationale:** Duplicating helpers would make maintaining the tests highly tedious. Centralizing them keeps individual test files focused purely on test assertions.
- **Trade-offs:** Test files must import these helpers and coordinate hook/fetch states using the `sharedTestState` object.

### Decision 2: Deferring Imports in Hoisted Mocks using `require()`

- **Chosen:** Declare standard file-level mocks (`jest.mock`) in each test file but defer reading shared state using dynamic inline imports:
  ```typescript
  jest.mock('@/lib/hooks/useCampaignStream', () => ({
    useCampaignStream: jest.fn((_, onEvent) => {
      const { sharedTestState } = require('./helpers');
      sharedTestState.capturedOnEvent = onEvent;
      return { status: 'open' };
    }),
  }));
  ```
- **Alternatives considered:** Repeating the full `capturedOnEvent` state handling inside each individual test file without helper coordination.
- **Rationale:** Without dynamic dynamic require/imports, Jest's module hoisting causes a `ReferenceError` because the mock runs before imports from `helpers.ts` are resolved. By loading the helper module dynamically *inside* the callback function, we defer import resolution until the component is rendered (long after modules are loaded).
- **Trade-offs:** Adds a slight runtime import overhead, which is negligible for unit tests.

### Decision 3: Create Dedicated `CampaignChat.composer.test.tsx`

- **Chosen:** Creating a separate `CampaignChat.composer.test.tsx` file for tests T6 (Composer), T7 (@mention dropdown autocomplete), and T8 (Send/POST submission).
- **Alternatives considered:** Shoving composer, mention, and send tests into `CampaignChat.drawer.test.tsx` or `CampaignChat.visibility.test.tsx`.
- **Rationale:** The composer logic (11 test cases) is independent of the drawer visibility/pin state and message display filtering. Grouping it separately keeps the code extremely clean and easy to browse.
- **Trade-offs:** Spawns one additional test file.

## Proposal to Design Mapping

- **Proposal element:** Decomposing tests into focused files.
  - **Design decision:** Split tests into 8 files under `tests/unit/components/CampaignChat/`.
  - **Validation approach:** Run `npm run test:unit` and verify all tests pass.
- **Proposal element:** Extracting shared setup to `helpers.ts`.
  - **Design decision:** Create `helpers.ts` exporting constants, setup tools, and mock spies.
  - **Validation approach:** Verify that individual test files successfully import and run using the helpers.
- **Proposal element:** original test file deleted.
  - **Design decision:** `tests/unit/components/CampaignChat.test.tsx` deleted.
  - **Validation approach:** Git check shows deletion of the file and addition of the new directory.

## Functional Requirements Mapping

- **Requirement:** Pill open/close, Escape key, pin state, and accessibility attributes.
  - **Design element:** `CampaignChat.drawer.test.tsx`
  - **Acceptance criteria reference:** Proposal scope -> drawer test suite (13 tests)
  - **Testability notes:** Verifies that click events and keyboard interactions toggle dock rendering.
- **Requirement:** Stream message append, heartbeat handling, duplicate message filtering, and session updates.
  - **Design element:** `CampaignChat.sse.test.tsx`
  - **Acceptance criteria reference:** Proposal scope -> sse test suite (6 tests)
  - **Testability notes:** Triggers event listeners returned by mocked campaign streams.
- **Requirement:** History loading states, cursor pagination, hasMore limits.
  - **Design element:** `CampaignChat.history.test.tsx`
  - **Acceptance criteria reference:** Proposal scope -> history test suite (3 tests)
  - **Testability notes:** Overrides mock fetch to simulate paginated history API payloads.
- **Requirement:** Unread count badges, badge clear, local storage operations and recovery.
  - **Design element:** `CampaignChat.unread.test.tsx`
  - **Acceptance criteria reference:** Proposal scope -> unread test suite (4 tests)
  - **Testability notes:** Mocks local storage set/get/remove and tests behavior when storage throws.
- **Requirement:** Member fetching on render, member fetching network failure.
  - **Design element:** `CampaignChat.members.test.tsx`
  - **Acceptance criteria reference:** Proposal scope -> members test suite (2 tests)
  - **Testability notes:** Fails members API fetch and asserts component does not throw/crash.
- **Requirement:** Message composer inputs, mentions autocomplete lists, message send triggering.
  - **Design element:** `CampaignChat.composer.test.tsx`
  - **Acceptance criteria reference:** Proposal scope -> composer test suite (11 tests)
  - **Testability notes:** Simulates typing, selecting options, clicking send, and mock POST payloads.
- **Requirement:** Message visibility rendering filter checks (group, DM, whispers).
  - **Design element:** `CampaignChat.visibility.test.tsx`
  - **Acceptance criteria reference:** Proposal scope -> visibility test suite (4 tests)
  - **Testability notes:** Matches HTML output strings for DM/whisper markers.
- **Requirement:** Scene composing permissions, compose cancel/success, scene message rendering.
  - **Design element:** `CampaignChat.scene.test.tsx`
  - **Acceptance criteria reference:** Proposal scope -> scene test suite (6 tests)
  - **Testability notes:** Simulates uploading JPEG images and triggering scene composition flows.

## Non-Functional Requirements Mapping

- **Requirement category:** Operability
  - **Requirement:** Decomposing tests should not break CI or slow it down significantly.
  - **Design element:** Keep all test assertions identical to the original; rely on Jest parallelization.
  - **Acceptance criteria reference:** original tests pass unchanged.
  - **Testability notes:** Verified by `npm run test:unit` execution time comparisons.

## Risks / Trade-offs

- **Risk/trade-off:** Parallelization startup overhead.
  - **Impact:** Spawning 8 test files instead of 1 will add slightly more process initialization time.
  - **Mitigation:** Overall CI runs tests in parallel. Since the largest suite has ~13 tests, execution time per file will be extremely fast, keeping total wall-clock time very low.

## Rollback / Mitigation

- **Rollback trigger:** Compilation or execution failure that cannot be easily fixed during migration.
- **Rollback steps:**
  1. `git checkout tests/unit/components/CampaignChat.test.tsx` (restores original file)
  2. `rm -rf tests/unit/components/CampaignChat/` (deletes refactored directory)
- **Data migration considerations:** N/A (Test code only)
- **Verification after rollback:** Run `npm run test:unit` to verify the original single suite is functioning correctly.

## Operational Blocking Policy

- **If CI checks fail:** Refactoring cannot be merged. Inspect test outputs and correct helper coordination or mock structures.
- **If security checks fail:** N/A (Test files do not affect application safety parameters).
- **If required reviews are blocked/stale:** Escalate to repository maintainers. Do not bypass approvals.

## Open Questions

None. The design is fully mapped to the existing test cases.
