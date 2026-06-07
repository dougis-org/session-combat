## Context

- **Relevant architecture:** Next.js App Router project. Page components live under `app/`. Shared lib components under `lib/components/`. Unit tests under `tests/unit/components/` (picked up by `npm run test:unit`). Auth is handled via `useAuth` hook. Navigation via `next/navigation` `useRouter`. Protected pages wrapped in `ProtectedRoute`.
- **Dependencies:** `@testing-library/react`, `@testing-library/user-event`, `jest`, `node-fetch` (for `Response` in tests). All already installed.
- **Interfaces/contracts touched:**
  - `app/encounters/page.tsx` — `EncountersContent` gets a named export; `EncounterEditor` is removed (moved)
  - `app/encounters/EncounterEditor.tsx` — new file; `EncounterEditor` named export
  - Three new test files under `tests/unit/components/`

## Goals / Non-Goals

### Goals

- Make `LoginPage`, `EncountersContent`, and `EncounterEditor` independently testable
- Write comprehensive unit tests for all three components
- Follow existing project conventions exactly (no new patterns introduced)

### Non-Goals

- Testing `MonsterEditor` in its current form
- Changes to `app/monsters/`
- Integration or E2E tests
- Any UI changes

## Decisions

### Decision 1: EncounterEditor extraction strategy

- **Chosen:** Extract `EncounterEditor` to `app/encounters/EncounterEditor.tsx` as a named export; remove it from `page.tsx`
- **Alternatives considered:** (a) Keep in `page.tsx` and export from there; (b) Mock `ProtectedRoute` and test via the default page export
- **Rationale:** Mirrors exactly the `app/campaigns/CampaignEditor.tsx` convention — the established project pattern for sub-components that need independent testing
- **Trade-offs:** Requires modifying a production source file, but the change is purely structural (move + add `export`) with zero behavioral impact

### Decision 2: Test pattern selection

- **Chosen:** RTL (`render`, `screen`, `waitFor`) + `jest.mock()` hoisted at file top + `userEvent.setup()` instance per test/describe block
- **Alternatives considered:** `uiTestSetup` helper pattern (used by `ForgotPasswordPage.test.tsx`)
- **Rationale:** The `uiTestSetup` pattern is older and uses `createRoot` manually; the RTL pattern is used by `RegisterPage`, `CampaignsPage`, and `CampaignEditor` — the most direct analogues. Prefer newer pattern.
- **Trade-offs:** None; both patterns coexist in the project

### Decision 3: MonsterEditor exclusion

- **Chosen:** Exclude `MonsterEditor` from this change entirely — no extraction, no test file
- **Rationale:** `MonsterEditor` will be replaced by a consolidated, expanded component in #379 (depends on #378). Writing tests now produces artifacts that are thrown away.
- **Trade-offs:** Temporary gap remains for `MonsterEditor`, but the gap is intentional and tracked

### Decision 4: EncounterEditor mock boundary

- **Chosen:** When testing `EncounterEditor`, mock `QuickCombatantModal`, `Modal`, and `MonsterEditor` (once it exists as an import) with simple null renders. Do NOT mock `EncounterEditor` when testing `EncountersContent` — import it directly and mock its children instead.
- **Rationale:** Matches `CampaignEditor.test.tsx` — tests the real form component, mocking only external modals and stat-form widgets
- **Trade-offs:** `EncounterEditor.test.tsx` is slightly more integrated than a pure unit test; acceptable per project convention

## Proposal to Design Mapping

- Proposal element: Extract `EncounterEditor` + export `EncountersContent`
  - Design decision: Decision 1 (extraction strategy)
  - Validation approach: TypeScript compilation + existing test suite green after extraction

- Proposal element: Three new test files under `tests/unit/components/`
  - Design decision: Decision 2 (test pattern) + Decision 4 (mock boundary)
  - Validation approach: `npm run test:unit` passes; Codacy coverage improves on these files

- Proposal element: MonsterEditor excluded
  - Design decision: Decision 3
  - Validation approach: No `MonsterEditor.test.tsx` created; issue #377 updated to document exclusion

## Functional Requirements Mapping

- Requirement: LoginPage renders email input, password input, submit button
  - Design element: `LoginPage.test.tsx` — rendering describe block
  - Acceptance criteria reference: `specs/login-page/spec.md`
  - Testability notes: No async; RTL `render` + `screen.getBy*`

- Requirement: LoginPage validates client-side (empty fields, invalid email format)
  - Design element: `LoginPage.test.tsx` — validation describe block
  - Acceptance criteria reference: `specs/login-page/spec.md`
  - Testability notes: `userEvent.type` + `fireEvent.submit`; check error text appears; verify `login` mock not called

- Requirement: LoginPage calls `login()` on valid submit and redirects on success
  - Design element: `LoginPage.test.tsx` — submit behavior
  - Acceptance criteria reference: `specs/login-page/spec.md`
  - Testability notes: Mock `useAuth` with spy `login` returning `true`; assert `router.replace` called with `/campaigns`

- Requirement: LoginPage shows error on failed login
  - Design element: `LoginPage.test.tsx` — error display
  - Acceptance criteria reference: `specs/login-page/spec.md`
  - Testability notes: Mock `login` returning `false`, mock `error` string on useAuth; assert error text in DOM

- Requirement: LoginPage redirects immediately when already authenticated
  - Design element: `LoginPage.test.tsx` — redirect-on-mount
  - Acceptance criteria reference: `specs/login-page/spec.md`
  - Testability notes: Mock `isAuthenticated: true`; assert `router.replace('/campaigns')` called in effect

- Requirement: EncountersContent fetches and renders encounter list on mount
  - Design element: `EncountersPage.test.tsx` — list rendering
  - Acceptance criteria reference: `specs/encounters-page/spec.md`
  - Testability notes: Mock global `fetch` returning encounter array; use `screen.findByText` (async)

- Requirement: EncountersContent shows empty state when list is empty
  - Design element: `EncountersPage.test.tsx` — empty state
  - Acceptance criteria reference: `specs/encounters-page/spec.md`
  - Testability notes: Mock fetch returning `[]`

- Requirement: EncountersContent delete calls confirm + DELETE endpoint + refreshes
  - Design element: `EncountersPage.test.tsx` — delete flow
  - Acceptance criteria reference: `specs/encounters-page/spec.md`
  - Testability notes: `jest.spyOn(window, 'confirm').mockReturnValue(true)`; assert fetch called with DELETE method

- Requirement: EncounterEditor shows Create vs Edit title based on `isNew`
  - Design element: `EncounterEditor.test.tsx` — title rendering
  - Acceptance criteria reference: `specs/encounter-editor/spec.md`
  - Testability notes: Direct prop; synchronous assertion

- Requirement: EncounterEditor Save disabled when name is empty
  - Design element: `EncounterEditor.test.tsx` — save button state
  - Acceptance criteria reference: `specs/encounter-editor/spec.md`
  - Testability notes: Pass encounter with empty name; assert button is disabled

- Requirement: EncounterEditor calls `onSave` with correct merged shape
  - Design element: `EncounterEditor.test.tsx` — save callback
  - Acceptance criteria reference: `specs/encounter-editor/spec.md`
  - Testability notes: `userEvent.type` name field; click Save; assert spy called with merged encounter object

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Tests must not depend on real network calls
  - Design element: All fetch calls mocked via `global.fetch = jest.fn()`
  - Acceptance criteria reference: All test files
  - Testability notes: `afterEach` restores original fetch

- Requirement category: operability
  - Requirement: Tests must be picked up by `npm run test:unit`
  - Design element: Files placed under `tests/unit/components/`
  - Testability notes: Verified by running `npm run test:unit` after creation

## Risks / Trade-offs

- Risk/trade-off: Extraction introduces a compile error if any import is missed
  - Impact: Medium — build breaks
  - Mitigation: Run `npm run build` or TypeScript check immediately after extraction, before writing any tests

- Risk/trade-off: `useAuth` mock shape may not cover all properties used by `EncounterEditor` (e.g. `user.userId`)
  - Impact: Low — runtime error in tests
  - Mitigation: Document required mock shape in design; verify by running tests iteratively

## Rollback / Mitigation

- Rollback trigger: TypeScript errors after `EncounterEditor` extraction, or `npm run test:unit` regression on existing tests
- Rollback steps: Revert `app/encounters/page.tsx` to original; delete `app/encounters/EncounterEditor.tsx`
- Data migration considerations: None — purely structural change
- Verification after rollback: `npm run test:unit` green; `npm run build` passes

## Operational Blocking Policy

- If CI checks fail: Do not merge; fix all failing checks before requesting review
- If security checks fail: Treat as blocking; escalate immediately
- If required reviews are blocked/stale: Wait up to 2 business days, then re-request review or escalate to project lead
- Escalation path and timeout: Flag in PR comments; tag reviewer directly after 2 business days

## Open Questions

No open questions. All design decisions were made during exploration and confirmed by the requester.
