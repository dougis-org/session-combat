## GitHub Issues

- #568

## Why

- Problem statement: `tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx` defines a local, zero-arg `async function openDock()` (line 68) that shares its exact name with `helpers.tsx`'s exported `openDock()` (line 78 of `helpers.tsx`), but the two are not interchangeable — `resize.test.tsx` never imports from `helpers.tsx` at all. A reader scanning across the `CampaignChat.*.test.tsx` suite cannot tell which `openDock` is in scope for a given file without checking imports.
- Why now: this is the second time a `helpers.tsx` split/promotion (the first being #518, which promoted `openDockWithSession`) has produced a same-name collision against a file-local helper. Fixing it now is cheap; leaving it risks a third occurrence as the suite keeps splitting.
- Business/user impact: test-only change, no runtime/user-facing impact. Impact is developer clarity and reduced risk of a future contributor accidentally assuming the two `openDock` functions are equivalent (they are not: `helpers.tsx`'s version also calls `mockActiveSessionIdCore(null)`, which the local version does not and cannot given its different mock setup).

## Problem Space

- Current behavior: `resize.test.tsx` mocks `useActiveSessionIdCore` statically via a module-level `jest.mock(...)` returning a fixed object, and defines its own `openDock()` (render + click the chat toggle) used at 4 call sites (lines 132, 168, 174, 197). This local function shadows, by name only, `helpers.tsx`'s exported `openDock()`, which additionally invokes `mockActiveSessionIdCore(null)` to back the hook with real React state.
- Desired behavior: the local helper is renamed to something unambiguous (e.g. `openDockLocal`) so no name in `resize.test.tsx` collides with a `helpers.tsx` export, while all 7 existing tests continue to pass unchanged in behavior.
- Constraints: `resize.test.tsx` tests (drag/resize/persistence) never mutate `activeSessionId`, so they do not need `helpers.tsx`'s stateful `mockActiveSessionIdCore` mock — the two mocking strategies are legitimately different, not accidentally duplicated.
- Assumptions: no other file in `tests/unit/components/CampaignChat/` has this collision (verified below); the fix is a pure rename with no behavior change.
- Edge cases considered: none — this is a mechanical rename with no logic change, so there are no new edge cases to cover. Existing test assertions are unaffected.

## Scope

### In Scope

- Rename `resize.test.tsx`'s local `openDock()` (line 68) to `openDockLocal()` and update its 4 call sites (lines 132, 168, 174, 197).
- Add a short guardrail comment in `helpers.tsx` near its exports, noting that local test helpers in `CampaignChat.*.test.tsx` files must not reuse a `helpers.tsx` export name, to reduce the odds of a third recurrence.

### Out of Scope

- Consolidating `resize.test.tsx` onto `helpers.tsx`'s shared `mockActiveSessionIdCore` infrastructure. Investigated during exploration and rejected: `resize.test.tsx`'s tests never touch `activeSessionId`, so its static mock is the correct/minimal setup for its needs. Forcing the shared stateful mock would add coupling to session-tracking logic with no behavioral benefit.
- A suite-wide local-helper naming convention or lint rule. Surveyed all 15 `CampaignChat.*.test.tsx` files during exploration: `resize.test.tsx` is the only file with a name collision against a `helpers.tsx` export. The other 14 either import shared helpers directly or already use uniquely-named local helpers (`drawer()`, `getFeedContainer()`, `markScrolledUp()`) with no collision. A blanket rule would be churn without a matching problem.
- Any change to `helpers.tsx`'s exported `openDock()`, `mockActiveSessionIdCore()`, or any other shared helper's behavior.
- Any change to `CampaignChat` component/runtime code.

## What Changes

- `tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx`: rename local helper `openDock` → `openDockLocal`; update 4 call sites.
- `tests/unit/components/CampaignChat/helpers.tsx`: add a one-line comment near the exports flagging the naming-collision risk for local test-file helpers.

## Risks

- Risk: rename typo missing one of the 4 call sites, causing a `ReferenceError` in that test.
  - Impact: one or more of the 7 tests in `resize.test.tsx` fail.
  - Mitigation: run the full `resize.test.tsx` file after the rename and confirm all 7 tests still pass before considering the task done.
- Risk: none identified for the `helpers.tsx` comment addition (comment-only change, no executable code touched).
  - Impact: none.
  - Mitigation: n/a.

## Open Questions

- None. This proposal follows directly from an `/opsx:explore` session on issue #568 in which both alternative scope expansions (shared-mock consolidation, suite-wide naming convention) were investigated and explicitly rejected by the user ("dig into #2 and #3 and if we need to expand scope to make the app more robust we can" → conclusion: neither expansion is warranted). The user then explicitly instructed proceeding to proposal mode and generating all artifacts, which per the change-control rule counts as approval to continue through design, specs, and tasks without an additional pause.

## Non-Goals

- Improving `resize.test.tsx`'s test coverage or restructuring its test cases.
- Auditing other test suites outside `CampaignChat.*.test.tsx` for similar collisions.
- Introducing tooling (ESLint rule, custom Jest reporter, etc.) to automatically detect helper-name collisions.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
