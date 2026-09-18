## Context

- Relevant architecture: Jest + React Testing Library unit test suite for the `CampaignChat` component, under `tests/unit/components/CampaignChat/`. `helpers.tsx` is a shared, non-test-file module in that directory exporting reusable render/mock helpers (`openDock`, `openDockWithSession`, `openDockWithSessionViaRealFetch`, `mockActiveSessionIdCore`, etc.) consumed by most sibling `*.test.tsx` files.
- Dependencies: none outside the test suite. No production/runtime code is touched.
- Interfaces/contracts touched: none — `helpers.tsx`'s public exports (names, signatures, behavior) are unchanged. Only `resize.test.tsx`'s private, file-scoped function name changes, plus a comment addition in `helpers.tsx`.

## Goals / Non-Goals

### Goals

- Eliminate the name collision between `resize.test.tsx`'s local `openDock()` and `helpers.tsx`'s exported `openDock()`.
- Preserve `resize.test.tsx`'s existing test behavior and mock strategy exactly (static, non-stateful `useActiveSessionIdCore` mock).
- Leave a low-cost signal in `helpers.tsx` to reduce the odds of a third such collision from a future split.

### Non-Goals

- Consolidating `resize.test.tsx` onto `helpers.tsx`'s shared `mockActiveSessionIdCore` infrastructure.
- Introducing a suite-wide naming convention, lint rule, or automated collision detection.
- Any change to `CampaignChat` component/runtime behavior.

## Decisions

### Decision 1: Rename the colliding local helper to `openDockLocal`

- Chosen: rename `resize.test.tsx`'s local `async function openDock()` (line 68) to `async function openDockLocal()`, and update its 4 call sites (lines 132, 168, 174, 197) to match.
- Alternatives considered:
  - Rename `helpers.tsx`'s `openDock()` instead — rejected: it's the shared, widely-imported name (used by `composer`, `drawer`, `history`, `sse`, `visibility` test files); renaming it would churn 5+ files for no benefit, and it is not the offending/shadowing side.
  - Import `helpers.tsx`'s `openDock` into `resize.test.tsx` and delete the local one — rejected (see Decision 2): the two have different mock setups and are not behaviorally interchangeable.
- Rationale: the local function is the one that shadows an existing export; renaming it is the smallest change that removes the ambiguity, and it is entirely file-local (no other file references `resize.test.tsx`'s internals).
- Trade-offs: none of consequence — this is a pure identifier rename with no logic change.

### Decision 2: Do not consolidate onto `helpers.tsx`'s stateful mock

- Chosen: keep `resize.test.tsx`'s existing static `jest.mock('@/lib/hooks/useActiveSessionId', ...)` block (lines 39-41) untouched.
- Alternatives considered: replace it with `helpers.tsx`'s `mockActiveSessionIdCore`, which backs the hook with real `React.useState` so tests that mutate `activeSessionId` (via `setActiveSessionId`/`handleStreamEvent`) re-render correctly.
- Rationale: none of `resize.test.tsx`'s tests mutate `activeSessionId` — they test drag/resize/persistence behavior only. The stateful mock exists to support tests that actually change session state (e.g. `sse.test.tsx`, the `rollFeed.*` files). Adopting it here would add an unused dependency on session-tracking mock machinery with zero behavioral benefit.
- Trade-offs: `resize.test.tsx` remains the one file with a bespoke mock for this hook, rather than converging on a single mock strategy across the suite. Accepted, because the divergence reflects a genuine difference in what each file's tests need, not oversight.

### Decision 3: Guardrail via a comment, not tooling

- Chosen: add a single-line comment in `helpers.tsx` near its exported helpers, flagging that local test-file helpers in `CampaignChat.*.test.tsx` files must not reuse a `helpers.tsx` export name.
- Alternatives considered: an ESLint rule (e.g. `no-restricted-syntax` or a custom rule) or a Jest setup check that fails on duplicate top-level function names across the directory.
- Rationale: this collision has occurred twice across ~2 suite splits, out of 15 files — not frequent enough to justify tooling investment. A comment at the point future editors will naturally look (the exports list) is proportionate.
- Trade-offs: a comment is easy to miss compared to automated enforcement; accepted given the low recurrence rate documented in the proposal.

## Proposal to Design Mapping

- Proposal element: rename `resize.test.tsx`'s local `openDock` to `openDockLocal` and update 4 call sites
  - Design decision: Decision 1
  - Validation approach: run `tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx` and confirm all existing tests still pass with no assertion changes
- Proposal element: do not consolidate onto shared `mockActiveSessionIdCore`
  - Design decision: Decision 2
  - Validation approach: no code change to validate; confirmed by design rationale and by re-running `resize.test.tsx` unchanged in mock setup
- Proposal element: add guardrail comment to `helpers.tsx`
  - Design decision: Decision 3
  - Validation approach: visual review of the diff; no test impact expected (comment-only change)

## Functional Requirements Mapping

- Requirement: `resize.test.tsx` must no longer define a function with the same name as any `helpers.tsx` export
  - Design element: Decision 1 (rename to `openDockLocal`)
  - Acceptance criteria reference: `specs/testing-conventions/spec.md` (to be authored) — "no local test helper shadows a `helpers.tsx` export name"
  - Testability notes: verifiable by grep (`grep -n "^async function openDock\b" resize.test.tsx` should no longer match `helpers.tsx`'s export name) and by the test file compiling/running without a duplicate-declaration or shadow-related lint warning
- Requirement: all 7 existing `resize.test.tsx` tests continue to pass unchanged
  - Design element: Decision 1 (mechanical rename only, no logic change)
  - Acceptance criteria reference: `specs/testing-conventions/spec.md` — "rename introduces no behavior change"
  - Testability notes: `npx jest tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx` before and after; identical pass count and assertions

## Non-Functional Requirements Mapping

- Requirement category: maintainability
  - Requirement: reduce the chance a third `helpers.tsx` split reintroduces this class of collision
  - Design element: Decision 3 (guardrail comment)
  - Acceptance criteria reference: `specs/testing-conventions/spec.md` — "helpers.tsx documents the naming-collision risk"
  - Testability notes: not automatically testable (comment, not enforced code); verified by manual review that the comment is present and legible

## Risks / Trade-offs

- Risk/trade-off: a call site is missed during the rename, leaving a stale reference to `openDock` inside `resize.test.tsx` that now resolves to nothing (no import exists) and throws `ReferenceError`.
  - Impact: one or more of the 4 call sites (lines 132, 168, 174, 197) fail at runtime with a clear, immediate error.
  - Mitigation: run the full `resize.test.tsx` file after the rename; a missed call site fails loudly and immediately, so this is self-verifying.
- Risk/trade-off: guardrail comment is ignored by a future editor, allowing a third collision.
  - Impact: low — same class of bug recurs, but it's cheap to fix again (as demonstrated by this change).
  - Mitigation: accepted risk per Decision 3; no further mitigation planned given the low recurrence rate.

## Rollback / Mitigation

- Rollback trigger: if the rename causes any `resize.test.tsx` test to fail unexpectedly, or if a reviewer identifies unintended coupling.
- Rollback steps: revert the single commit/PR for this change; both edits (rename in `resize.test.tsx`, comment in `helpers.tsx`) are independent and reversible via `git revert` with no follow-up cleanup required.
- Data migration considerations: none — no data, storage, or runtime state is touched.
- Verification after rollback: re-run `resize.test.tsx` to confirm the suite returns to its pre-change passing state.

## Operational Blocking Policy

- If CI checks fail: investigate the specific failing test in `resize.test.tsx` (most likely a missed call-site rename); fix and re-push. Do not bypass CI for this change.
- If security checks fail: not expected (test-only, no runtime/security-relevant code touched); if a scanner flags something, treat as a false positive first and confirm with `verity feedback finding` per project policy before waiving.
- If required reviews are blocked/stale: this is a small, self-contained test-file change; ping the reviewer directly rather than escalating further.
- Escalation path and timeout: if unresolved after 2 business days, raise in the normal project channel — no special escalation needed given the change's small blast radius.

## Open Questions

- None.
