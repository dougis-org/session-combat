## Context

- **Relevant architecture:** Component tests live in `tests/unit/components/`. The project uses Jest with jsdom and RTL (`@testing-library/react` ^16, `@testing-library/user-event` ^14, `@testing-library/jest-dom` ^6). RTL is configured globally via `jest.setup.ts` (imports `@testing-library/jest-dom`). `jest.config.js` uses `setupFilesAfterFramework`.
- **Dependencies:** `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` already installed (issue #254). No new package additions required.
- **Interfaces/contracts touched:** Test files only. No production source files are modified.

## Goals / Non-Goals

### Goals

- Migrate all three test files to use only RTL APIs (`render`, `screen`, `within`, `userEvent`)
- Preserve or improve statement coverage for each component
- Establish `TargetActionModal.test.tsx` as the canonical RTL pattern reference for the project
- Delete `tests/unit/helpers/reactRoot.ts` when it has no remaining consumers
- Remove `IS_REACT_ACT_ENVIRONMENT` globals and dead `createRoot`/`Root`/`act` imports

### Non-Goals

- Modifying production source components
- Adding net-new test cases beyond coverage parity
- Migrating files outside the three named above

## Decisions

### Decision 1: Migration order — ui.test.tsx first

- **Chosen:** Migrate in order: `ui.test.tsx` → `TargetActionModal.test.tsx` → `CreatureStatsForm.test.tsx`
- **Alternatives considered:** All three in parallel; TargetActionModal first (it's the pattern reference per the issue)
- **Rationale:** `ui.test.tsx` is the simplest file (pure renders, one interaction). It serves as a fast sanity check that RTL works correctly in this test environment before tackling files with more complex state flows. User confirmed this order.
- **Trade-offs:** Slightly delays establishing the TargetActionModal as the reference, but reduces risk of wasted effort if a basic RTL issue surfaces.

### Decision 2: `userEvent.setup()` per test (not shared instance)

- **Chosen:** Create a `const user = userEvent.setup()` inside each `test`/`it` that needs interaction.
- **Alternatives considered:** Shared `user` in `beforeEach`; top-level module constant.
- **Rationale:** Consistent with existing RTL tests in the project (Modal.test.tsx, CombatInfoIcon.test.tsx). `userEvent.setup()` creates isolated event state per test, preventing inter-test contamination.
- **Trade-offs:** Slightly more boilerplate per test; negligible performance cost.

### Decision 3: `within()` for CreatureStatsForm checkbox scoping

- **Chosen:** Use `screen.getByText('Damage Resistances').closest('div')` to obtain the section container, then `within(container).getByRole('checkbox', { name: /fire/i })` to target specific checkboxes.
- **Alternatives considered:** `getAllByRole('checkbox', { name: /fire/i })[N]` (index-based, fragile); adding `data-testid` to section divs in the source component (requires source changes, out of scope).
- **Rationale:** `within()` scoping is the RTL-idiomatic way to disambiguate repeated element names. Targeting the section by its label text is explicit and readable without requiring production code changes.
- **Trade-offs:** The scoping is structurally coupled to the component's DOM layout (label → sibling div). A future layout change could break the scoping. Document this with a single comment in the test file.

### Decision 4: Query strategy per component

- **Chosen:**
  - `ui.test.tsx`: `getByText`, `getByLabelText` (FormField/TextInputField have label→input wiring), `getByRole('button', { name: /.../ })`, `getByRole('heading')` for h2
  - `TargetActionModal.test.tsx`: `getByRole('button', { name: /.../ })` for buttons, `getByPlaceholderText` for unlabelled number/text inputs, `getByRole('combobox', { name: /damage type/i })` for the select (it has `aria-label`)
  - `CreatureStatsForm.test.tsx`: `getByRole('button', { name: /resistances/i })` for the expand toggle, `within(sectionEl).getByRole('checkbox', { name: /type/i })` for checkboxes
- **Alternatives considered:** `getByTestId` (requires `data-testid` on source); `container.querySelector` (defeats RTL purpose)
- **Rationale:** Role/label/text queries are the RTL-preferred hierarchy. Placeholder queries are a pragmatic fallback for unlabelled inputs where source changes are out of scope.
- **Trade-offs:** `getByPlaceholderText` is lower in RTL's recommended query priority (below role and label queries), but it's appropriate here given the constraint.

### Decision 5: Conditional deletion of `reactRoot.ts` helper

- **Chosen:** Delete `tests/unit/helpers/reactRoot.ts` at implementation time only if `grep -r "reactRoot" tests/` returns no results.
- **Alternatives considered:** Delete unconditionally now; leave it forever.
- **Rationale:** `ui.test.tsx` is the only known consumer, but #260 (other files) may or may not have completed by implementation time. A runtime check is the safe approach.
- **Trade-offs:** Leaves a potential dead file if #260 isn't done; acceptable — the file is small and harmless.

## Proposal to Design Mapping

- **Proposal: Migrate ui.test.tsx first**
  - Design decision: Decision 1 (migration order)
  - Validation approach: File uses only RTL imports; `npm test` passes after each file
- **Proposal: `TargetActionModal` has unlabelled inputs → use `getByPlaceholderText`**
  - Design decision: Decision 4 (query strategy)
  - Validation approach: Tests pass and accurately exercise component behavior
- **Proposal: `CreatureStatsForm` has 39 duplicate-named checkboxes → use `within()`**
  - Design decision: Decision 3 (`within()` scoping)
  - Validation approach: Checkbox tests correctly target the right section; `npm test` passes
- **Proposal: Conditional `reactRoot.ts` deletion**
  - Design decision: Decision 5 (conditional deletion)
  - Validation approach: `grep -r "reactRoot" tests/` returns empty before deletion

## Functional Requirements Mapping

- **Requirement:** All three files use RTL imports exclusively (no `createRoot`, `react-dom/client`, `IS_REACT_ACT_ENVIRONMENT`)
  - Design element: Decisions 1, 2, 4
  - Acceptance criteria reference: `specs/ui-primitives/spec.md`, `specs/target-action-modal/spec.md`, `specs/creature-stats-form/spec.md`
  - Testability notes: Import-level check; grep or lint can verify absence of banned imports
- **Requirement:** All existing test cases pass after migration
  - Design element: Decision 4 (query strategy per component)
  - Acceptance criteria reference: All three spec files
  - Testability notes: `npm test -- --testPathPattern="(ui|TargetActionModal|CreatureStatsForm).test"` green
- **Requirement:** `TargetActionModal.test.tsx` serves as the canonical RTL reference
  - Design element: Decision 2 (`userEvent.setup()` per test), Decision 4
  - Acceptance criteria reference: `specs/target-action-modal/spec.md`
  - Testability notes: Code review; file is fully commented-free except for the one `within()` note

## Non-Functional Requirements Mapping

- **Requirement category:** Operability
  - Requirement: Test run time must not regress significantly (RTL `userEvent` is async but not slow)
  - Design element: Decision 2 (`userEvent.setup()` per test, not globally shared)
  - Acceptance criteria reference: CI must pass within normal timeout
  - Testability notes: CI run time comparison before/after

## Risks / Trade-offs

- **Risk:** `getByPlaceholderText` is a lower-priority RTL query; if inputs gain `aria-label` later, tests should be updated.
  - Impact: Low — tests still work, but a future `getByLabelText` would be more robust.
  - Mitigation: Acceptable for now; note in test file comment.
- **Risk:** `within()` scoping tied to DOM structure of `CreatureStatsForm`.
  - Impact: Medium — layout changes break scoping silently if the label text moves.
  - Mitigation: Single comment in the test file documenting the DOM dependency.

## Rollback / Mitigation

- **Rollback trigger:** CI fails on any of the three migrated test files and cannot be fixed within the PR iteration.
- **Rollback steps:** Revert the affected test file to its pre-migration state from `main`. Open a follow-up issue for the specific file.
- **Data migration considerations:** None — test files only.
- **Verification after rollback:** `npm test` passes on `main`.

## Operational Blocking Policy

- **If CI checks fail:** Diagnose the failure, fix in the same branch, push, wait 180 seconds, re-check. Repeat until green or rollback is triggered.
- **If security checks fail:** Not applicable — this change touches only test files, no production code or secrets.
- **If required reviews are blocked/stale:** Ping the reviewer after 24 hours. If no response after 48 hours, escalate to the team lead.
- **Escalation path and timeout:** If CI remains blocked after 3 fix iterations, revert the specific file (not the whole PR) and open a scoped follow-up issue.

## Open Questions

None. All design decisions are resolved based on codebase investigation and user confirmation.
