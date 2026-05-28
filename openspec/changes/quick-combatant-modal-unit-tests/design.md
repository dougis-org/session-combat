## Context

- Relevant architecture: `lib/components/QuickCombatantModal.tsx` is a pure React component with no server-side concerns. All data arrives via props (`monsterTemplates`, `characterTemplates`). Internal state is managed with `useState` and `useMemo`; Fuse.js is used for client-side fuzzy search. No hooks require mocking.
- Dependencies:
  - `@testing-library/react` — already installed, confirmed in `jest.setup.ts`
  - `@testing-library/jest-dom` — already installed, imported in `jest.setup.ts`
  - `@testing-library/user-event` — required for realistic interaction simulation; verify in `package.json`
  - `fuse.js` — real library used (not mocked)
  - `next/link` — requires module-level mock in jsdom
  - `lib/constants` — imports `GLOBAL_USER_ID` for creator-filter fixture setup
  - `lib/types` — `Monster`, `MonsterTemplate`, `Character` types for fixtures
- Interfaces/contracts touched: none (test-only change; no production code modified)

## Goals / Non-Goals

### Goals

- Write `tests/unit/components/QuickCombatantModal.test.tsx` using RTL
- Achieve ≥ 70% statement coverage and ≥ 55% branch coverage on `QuickCombatantModal.tsx`
- Cover all three tabs, all filter combinations, both selection callbacks, and all custom-form validation branches
- Follow the RTL pattern established by `tests/unit/CombatStatsRow.rtl.test.tsx` (not the older `createRoot` pattern)

### Non-Goals

- Modifying any production code
- Achieving 100% branch coverage (two branches are explicitly excluded per proposal)
- Migrating other test files to RTL

## Decisions

### Decision 1: RTL over createRoot

- Chosen: `@testing-library/react` (`render`, `screen`, `userEvent`)
- Alternatives considered: `createRoot` + manual DOM querying (used in `TargetActionModal.test.tsx`)
- Rationale: The codebase is actively migrating to RTL (issues #260–263). All new component tests should follow the RTL pattern to avoid adding to the migration backlog. RTL's accessible queries also make assertions more semantically meaningful.
- Trade-offs: `userEvent` setup adds a small amount of boilerplate per test (async setup); this is minor compared to the long-term maintenance benefit.

### Decision 2: Real Fuse.js, no mock

- Chosen: Use real Fuse.js with carefully chosen fixture names
- Alternatives considered: Mock `fuse.js` module to return deterministic results
- Rationale: Mocking Fuse.js would test that we call it, not that it actually filters correctly. Using real Fuse.js with simple, clearly distinct fixture names ("Goblin", "Orc", "Troll") gives meaningful coverage of the search-filter logic with negligible flakiness risk. The 0.3 threshold is permissive but won't match "Goblin" when searching "Orc".
- Trade-offs: Fuzzy matching could theoretically produce surprising results for future fixtures. Mitigated by using short, visually distinct names.

### Decision 3: Per-file `@jest-environment jsdom` docblock

- Chosen: Include `@jest-environment jsdom` docblock at top of file
- Alternatives considered: Rely on global jest config change (issue #264)
- Rationale: Issue #264 is open but unmerged. The per-file docblock is the current standard used by all 38 existing component tests. Once #264 lands, the docblock becomes harmless redundancy — no refactor needed.
- Trade-offs: Minor boilerplate; zero maintenance cost.

### Decision 4: Mock `next/link`

- Chosen: `jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }) => <a href={href}>{children}</a> }))`
- Alternatives considered: Rely on Next.js's test export of Link
- Rationale: Next.js's Link component uses router context that is unavailable in jsdom. The component only uses Link for navigation hints in empty states — the actual href is not tested. A minimal mock renders the children as an anchor without router dependency.
- Trade-offs: None for this use case.

### Decision 5: Spy on `crypto.randomUUID`

- Chosen: `jest.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid')` in `beforeEach`
- Alternatives considered: Accept any string id (use `expect.any(String)`)
- Rationale: Asserting the exact returned id value makes the `onAddMonster` payload assertion fully deterministic and easier to read. Spying is preferable to mocking the entire `crypto` module.
- Trade-offs: If jsdom doesn't expose `crypto.randomUUID`, fall back to `Object.defineProperty(global, 'crypto', ...)`.

### Decision 6: Tab panel query strategy

- Chosen: Use unique `aria-label` values on inputs (`"Search monsters"`, `"Search characters"`) and `aria-label` values on Add buttons (`"Add Goblin to encounter"`) to avoid needing `within()` scoping.
- Alternatives considered: `within(screen.getByRole('tabpanel', { hidden: false }))` scoping
- Rationale: The component's elements have unique accessible labels that make them unambiguous without scoping. Accessible-label queries are more readable and self-documenting. `within()` is reserved for cases where labels genuinely collide.
- Trade-offs: If a future refactor removes or changes aria-labels, tests break with clear error messages (desired behavior).

### Decision 7: Skip toast auto-dismiss

- Chosen: Do not test the `useEffect` 2-second auto-dismiss
- Alternatives considered: `jest.useFakeTimers()` + `act(() => jest.advanceTimersByTime(2000))`
- Rationale: Auto-dismiss is well-established browser/React behavior. Testing it adds timer-related async complexity and brings no meaningful safety value. Testing that the toast appears is sufficient.
- Trade-offs: Zero coverage on lines 38–43. Acceptable per proposal.

## Proposal to Design Mapping

- Proposal element: Tests use RTL pattern
  - Design decision: Decision 1 (RTL over createRoot)
  - Validation approach: File imports `render`, `screen`, `userEvent` from RTL; no `createRoot` import

- Proposal element: Fuse.js fuzzy search tested with real library
  - Design decision: Decision 2 (real Fuse.js)
  - Validation approach: Type "Goblin" in search → only Goblin row visible; clear → all rows visible

- Proposal element: jsdom environment without #264 dependency
  - Design decision: Decision 3 (per-file docblock)
  - Validation approach: `@jest-environment jsdom` docblock at file top; tests pass in CI

- Proposal element: `next/link` doesn't crash in jsdom
  - Design decision: Decision 4 (mock next/link)
  - Validation approach: Empty-state renders without router errors

- Proposal element: `onAddMonster` payload shape verification
  - Design decision: Decision 5 (spy crypto.randomUUID)
  - Validation approach: `expect(onAddMonster).toHaveBeenCalledWith(expect.objectContaining({ id: 'test-uuid', templateId: 'g1' }))`

- Proposal element: Tab content not confused across tabs
  - Design decision: Decision 6 (aria-label query strategy)
  - Validation approach: `getByLabelText('Search monsters')` vs `getByLabelText('Search characters')` — each unique

- Proposal element: Toast auto-dismiss not tested
  - Design decision: Decision 7 (skip)
  - Validation approach: N/A — explicitly out of scope

## Functional Requirements Mapping

- Requirement: Modal renders with monsters tab active by default
  - Design element: `screen.getByRole('tab', { name: 'Monsters' })` has `aria-selected="true"`
  - Acceptance criteria reference: specs/render-and-navigation.md
  - Testability notes: Direct aria attribute assertion; no interaction needed

- Requirement: Close button and backdrop call `onClose`
  - Design element: `userEvent.click` on close button / backdrop element
  - Acceptance criteria reference: specs/render-and-navigation.md
  - Testability notes: `onClose` is a jest.fn(); assert `toHaveBeenCalledTimes(1)`

- Requirement: Search filters monster list
  - Design element: `userEvent.type` into `aria-label="Search monsters"` input
  - Acceptance criteria reference: specs/search-and-filter.md
  - Testability notes: Use "Goblin" as search term; assert Goblin row present, Orc absent

- Requirement: Creator filter narrows results
  - Design element: `userEvent.click` on filter buttons (My / Global / Other)
  - Acceptance criteria reference: specs/search-and-filter.md
  - Testability notes: Each filter tested in isolation with fixtures covering all userId combinations

- Requirement: Monster Add calls `onAddMonster` with correct payload
  - Design element: `userEvent.click` on `aria-label="Add Goblin to encounter"`
  - Acceptance criteria reference: specs/selection.md
  - Testability notes: Assert `toHaveBeenCalledWith(expect.objectContaining({ id: 'test-uuid', templateId: 'g1', name: 'Goblin' }))`

- Requirement: Custom form validates and submits
  - Design element: Fill fields via `userEvent.type`/`userEvent.clear`, submit via button click
  - Acceptance criteria reference: specs/custom-form.md
  - Testability notes: Each validation branch tested by omitting or setting invalid field values; error text asserted via `screen.getByText`

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Tests must pass consistently in CI (no flakiness)
  - Design element: Real Fuse.js with distinct fixture names; no fake timers; deterministic uuid spy
  - Acceptance criteria reference: All tests pass on `npm run test:unit -- QuickCombatantModal`
  - Testability notes: Run 3× locally before merging to confirm no timer/async flakiness

- Requirement category: operability
  - Requirement: Test file follows established project conventions
  - Design element: `@jest-environment jsdom` docblock; `IS_REACT_ACT_ENVIRONMENT = true`; file in `tests/unit/components/`
  - Acceptance criteria reference: Consistent with `TargetActionModal.test.tsx` header conventions
  - Testability notes: Code review check

## Risks / Trade-offs

- Risk/trade-off: Fuse.js returns unexpected matches for fixture data
  - Impact: Search-filter tests produce false positives or false negatives
  - Mitigation: Verify locally by running the specific describe block; adjust fixture names if needed

- Risk/trade-off: `userEvent` async API adds boilerplate
  - Impact: Slightly more verbose tests (`const user = userEvent.setup(); await user.type(...)`)
  - Mitigation: Define `user` in a shared `beforeEach` or as a describe-level constant

## Rollback / Mitigation

- Rollback trigger: New test file causes CI failure (environment, import error, or unexpected coverage regression)
- Rollback steps: Delete `tests/unit/components/QuickCombatantModal.test.tsx`; no production code was changed
- Data migration considerations: None
- Verification after rollback: CI passes without the new file; coverage metrics return to baseline

## Operational Blocking Policy

- If CI checks fail: Diagnose locally with `npx jest tests/unit/components/QuickCombatantModal.test.tsx --verbose`; fix before merging
- If security checks fail: N/A — no production code changes, no new dependencies
- If required reviews are blocked/stale: Ping reviewer after 48 hours; escalate to maintainer after 72 hours
- Escalation path and timeout: Tag `@dougis` in PR if unresolved after 72 hours

## Open Questions

No open questions. All design decisions resolved during explore and proposal phases.
