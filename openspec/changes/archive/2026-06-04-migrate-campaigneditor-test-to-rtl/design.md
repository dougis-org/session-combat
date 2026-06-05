## Context

- Relevant architecture: Next.js 15 app with a Jest + jsdom unit test suite. Page-level component tests live in `tests/unit/components/`. RTL (`@testing-library/react` v16, `@testing-library/user-event` v14) and `@testing-library/jest-dom` are already installed and configured in `jest.setup.ts`.
- Dependencies: `lib/components/ui.tsx` (TextInputField), `app/campaigns/CampaignEditor.tsx` (component under test), `tests/unit/components/CampaignEditor.test.tsx` (test file being migrated), `tests/unit/helpers/reactRoot.ts` (legacy helper — imports removed, helper itself untouched).
- Interfaces/contracts touched:
  - `TextInputField` props: `id` remains optional; behaviour changes only when `id` is absent (auto-generated instead of undefined).
  - `CampaignEditor` JSX: new `aria-label` attributes added to chapter title inputs and remove button. No prop or callback signature changes.

## Goals / Non-Goals

### Goals

- Eliminate all legacy `createRoot`/`act`/`container.querySelector` patterns from `CampaignEditor.test.tsx`.
- Make `TextInputField` self-labelling (auto `id` from `label`) so RTL name queries work without caller changes.
- Ensure all chapter interactive elements have accessible names RTL can query.
- Keep all 26 existing tests passing with identical assertions on component behaviour.

### Non-Goals

- Changing `TextInputField` public prop API beyond the `id`-generation behaviour.
- Adding new tests.
- Modifying any other test file or component.

## Decisions

### Decision 1: TextInputField auto-generates `id` from `label`

- Chosen: Derive `id` from `label` by lowercasing, replacing non-alphanumeric runs with `-`, and stripping leading/trailing hyphens. E.g., `"Campaign Name *"` → `"campaign-name"`. Apply only when `id` prop is absent.
- Alternatives considered: Require callers to always pass `id` (too invasive — all existing call sites would need updates); use `React.useId()` (non-deterministic in tests without mocking; also unavailable in older React versions).
- Rationale: Deterministic, human-readable, zero caller-side changes needed. The label text is already the semantic name for the input.
- Trade-offs: If two `TextInputField` components on the same page share an identical label string, their `id`s will collide. Acceptable: label text is semantically unique by design; callers can always supply an explicit `id` to override.

### Decision 2: Chapter element accessible names

- Chosen:
  - Chapter title input: `aria-label={`Chapter ${index + 1} title`}` — e.g., `"Chapter 1 title"`.
  - Remove button: `aria-label={`Remove ${ch.title || `chapter ${index + 1}`}`}` — e.g., `"Remove Arrival"` or `"Remove chapter 1"` when untitled.
  - Move-up / move-down buttons: existing `aria-label={`Move chapter ${index + 1} up`}` retained as-is (already RTL-queryable, already present on all buttons).
- Alternatives considered: Title-based labels for all buttons (`"Move The Inn up"`) — rejected because the explore session confirmed position-based labels are acceptable and the remove button gap is the only missing aria-label.
- Rationale: Consistent with decisions agreed during exploration. Minimises component diff while closing the accessibility gap on the remove button.
- Trade-offs: Move button labels are position-based, not title-based. Tests that move a chapter must query by ordinal (`/move chapter 2 up/i`), which is still robust — the ordinal is derived from `index` which reflects the current render order.

### Decision 3: RTL interaction strategy

- Chosen: `userEvent.click` for buttons and accordion; `userEvent.selectOptions` for `<select>` elements; `userEvent.clear` + `userEvent.type` for text inputs. `userEvent.setup()` called once per test (or shared via `beforeEach`).
- Alternatives considered: `fireEvent` — lower-level, does not simulate full browser event sequences; kept only if `userEvent` proves incompatible with a specific element.
- Rationale: `userEvent` v14 fires the full pointer+keyboard event sequence, exercising React's synthetic event system correctly. This is the gap the current manual `dispatchEvent` hacks expose.
- Trade-offs: `userEvent` is async (`await` required everywhere). Test bodies become slightly more verbose but far more readable.

### Decision 4: `openChapters` helper retained as RTL version

- Chosen: Keep the shared helper, rewritten to use `screen.queryByText` and `userEvent.click`. Called from 7+ tests.
- Alternatives considered: Inline per-test — rejected for DRY reasons; the accordion toggle is a one-liner in concept but the guard condition (only click if not already open) saves brittle test-order coupling.
- Rationale: Helper is cohesive, idempotent, and short. RTL version is equally readable.
- Trade-offs: Shared helpers can obscure test setup. Mitigated by the helper being trivially small.

## Proposal to Design Mapping

- Proposal element: TextInputField generates `id` from `label`
  - Design decision: Decision 1
  - Validation approach: RTL `screen.getByRole('textbox', { name: /campaign name/i })` resolves correctly in migrated tests.

- Proposal element: Chapter title inputs gain accessible name
  - Design decision: Decision 2 (title input aria-label)
  - Validation approach: `screen.getAllByRole('textbox', { name: /chapter \d+ title/i })` returns expected count.

- Proposal element: Remove button gains aria-label; move buttons verified
  - Design decision: Decision 2 (remove + move labels)
  - Validation approach: `screen.getByRole('button', { name: /remove arrival/i })` resolves after chapters rendered.

- Proposal element: All act() / dispatchEvent hacks removed
  - Design decision: Decision 3
  - Validation approach: No `act`, `dispatchEvent`, or `element.value =` appears in migrated test file (enforced by grep in CI via existing lint rules).

- Proposal element: openChapters helper retained
  - Design decision: Decision 4
  - Validation approach: All tests that call `openChapters()` continue to pass; helper has no direct assertions.

## Functional Requirements Mapping

- Requirement: All 26 existing test cases pass after migration
  - Design element: RTL render + screen + userEvent replacements (Decisions 3, 4)
  - Acceptance criteria reference: specs/rtl-migration/spec.md — "All 26 test cases pass"
  - Testability notes: `jest --testPathPattern CampaignEditor` — green run is the criterion.

- Requirement: TextInputField accessible by label name
  - Design element: Decision 1 (auto id generation)
  - Acceptance criteria reference: specs/rtl-migration/spec.md — "Inputs queryable by accessible name"
  - Testability notes: `screen.getByRole('textbox', { name: /campaign name \*/i })` must not throw.

- Requirement: Chapter interactive elements have aria-labels
  - Design element: Decision 2
  - Acceptance criteria reference: specs/rtl-migration/spec.md — "Chapter elements have accessible names"
  - Testability notes: `screen.getByRole('button', { name: /remove arrival/i })` and `screen.getByRole('button', { name: /move chapter 2 up/i })` must resolve.

- Requirement: No legacy test boilerplate remains
  - Design element: Import cleanup (remove React, Root, act, createReactRoot, unmountReactRoot)
  - Acceptance criteria reference: specs/rtl-migration/spec.md — "Legacy boilerplate removed"
  - Testability notes: Grep for `createReactRoot|IS_REACT_ACT_ENVIRONMENT|@jest-environment jsdom` in file returns no matches.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Tests must not be order-dependent or share mutable state
  - Design element: RTL automatic cleanup (no manual `beforeEach`/`afterEach` for container); `jest.fn()` created fresh per test.
  - Acceptance criteria reference: specs/rtl-migration/spec.md — "Tests are isolated"
  - Testability notes: Running tests in random order (`--randomize`) must produce the same pass/fail result.

- Requirement category: operability
  - Requirement: Test file compiles with zero TypeScript errors
  - Design element: RTL types are bundled with `@testing-library/react`; `userEvent` types with `@testing-library/user-event`. No extra `@types` needed.
  - Acceptance criteria reference: specs/rtl-migration/spec.md — "TypeScript compiles cleanly"
  - Testability notes: `tsc --noEmit` passes.

## Risks / Trade-offs

- Risk/trade-off: `userEvent.selectOptions` fires a different event sequence than `dispatchEvent('change')`, potentially exposing a pre-existing React state bug.
  - Impact: A test that currently passes may fail after migration, indicating a real component bug.
  - Mitigation: Treat test failures as signal to investigate the component, not to revert to `dispatchEvent`.

- Risk/trade-off: Auto-generated `id` collisions if label text is non-unique.
  - Impact: Low — form labels are conventionally unique. ARIA spec also requires unique IDs.
  - Mitigation: Document in `TextInputField` JSDoc; existing callers can pass explicit `id`.

## Rollback / Mitigation

- Rollback trigger: CI red after migration and no fix found within one working day.
- Rollback steps: Revert `CampaignEditor.test.tsx` to its pre-migration state (git revert); revert `ui.tsx` and `CampaignEditor.tsx` component changes if they introduced a regression.
- Data migration considerations: None — test-only change plus minor a11y additions; no data model touched.
- Verification after rollback: `jest --testPathPattern CampaignEditor` green; CI passes.

## Operational Blocking Policy

- If CI checks fail: Investigate failing test output; fix the root cause in component or test before merging. Do not revert to legacy patterns to unblock.
- If security checks fail: N/A — no new dependencies, no network calls, no secrets.
- If required reviews are blocked/stale: Ping reviewer after 24 h; escalate to project lead after 48 h.
- Escalation path and timeout: If blocked > 2 working days, raise in team standup and agree on unblocking approach.

## Open Questions

No open questions. All decisions confirmed during the explore session.
