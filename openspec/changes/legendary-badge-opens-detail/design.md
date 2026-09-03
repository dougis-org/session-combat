## Context

- Relevant architecture:
  - `lib/components/CombatantCard.tsx` (`'use client'`, ~883 lines) renders one combatant row in the initiative order. It already exposes an optional `onShowDetails?: (combatantId: string, position: { top: number; left: number }) => void` prop (`CombatantCard.tsx:23`), invoked today by the combatant-name button (`CombatantCard.tsx:483-486`) to open the detail panel.
  - The legendary-action badge is a non-interactive `<span data-testid="legendary-action-badge">` at `CombatantCard.tsx:551-558`, shown only when `(combatant.legendaryActionCount ?? 0) > 0`.
  - `lib/components/ActiveCombatView.tsx` owns detail-panel state (`selectedDetailCombatantId`, `detailPosition`) and passes `onShowDetails={(id, pos) => { setSelectedDetailCombatantId(id); setDetailPosition(pos); }}` to `<CombatantCard>` (`ActiveCombatView.tsx:173-176`). It renders `<CombatantDetailPanel>` at `ActiveCombatView.tsx:393-400`.
  - `lib/components/CombatantDetailPanel.tsx:95` renders `<LegendaryActionsPanel>` (spend / restore / pool editor). Lair actions have their own initiative-order entry via `<LairActionsSlot>` in `ActiveCombatView.tsx` for `type === 'lair'` combatants.
  - `CombatantCard.tsx:8-9` imports `LegendaryActionsPanel` and `LairActionsSlot` but never renders them (dead imports).
- Dependencies:
  - React 18 + Next.js app-router client components; Tailwind CSS.
  - Test stack: React Testing Library + Jest, run via `npm run test:unit` (no `npm test` script).
- Interfaces/contracts touched:
  - `CombatantCard` public props: **unchanged** (`onShowDetails` already exists and is already optional).
  - `CombatantCard` DOM: the element carrying `data-testid="legendary-action-badge"` changes from `<span>` to `<button type="button">`.
  - No change to `CombatantState`, combat reducers/utils, persistence, or `onUpdate`.

## Goals / Non-Goals

### Goals

- Make the legendary-action badge a discoverable, keyboard-accessible control that opens the existing `CombatantDetailPanel` (where legendary spend/restore already lives).
- Preserve the badge's current visual appearance and `N/M` text, adding only a clickability affordance.
- Keep `data-testid="legendary-action-badge"` stable.
- Remove the two dead imports from `CombatantCard.tsx`.
- No new component props; no `ActiveCombatView` wiring changes.

### Non-Goals

- No legendary/lair action controls rendered on the card itself.
- No `CombatantDetailPanel` changes (no auto-scroll/focus to the legendary section).
- No lair-action affordance on the card.
- Not part of the #680 decomposition.

## Decisions

### Decision 1: Reuse the existing `onShowDetails` prop rather than add a new one

- Chosen: The badge button calls `onShowDetails?.(combatant.id, position)` with a position derived from `event.currentTarget.getBoundingClientRect()`, mirroring the name button at `CombatantCard.tsx:483-486`.
- Alternatives considered:
  - Add `onShowDetail?: (id: string) => void` — rejected: redundant, widens the prop surface of an already-oversized component, needs `ActiveCombatView` changes.
  - Have the card open a panel itself — rejected: panel state and rendering belong to `ActiveCombatView`; the card is a presentational row.
- Rationale: The exact capability needed already exists and is already wired end-to-end. This makes the change a near-local edit.
- Trade-offs: The badge and name button both open the same panel — acceptable and expected (two affordances, one destination). Position may be marginally offset vs. the name button.

### Decision 2: `<span>` → `<button type="button">`, styled to preserve appearance

- Chosen: Replace the `<span>` with `<button type="button">`, keeping `data-testid="legendary-action-badge"` and the `⚡ {remaining}/{count}` content. Apply Tailwind resets so it does not inherit default button chrome (`bg-transparent border-0 p-0` as needed), keep the existing `text-sm font-semibold text-amber-400 whitespace-nowrap`, and add `cursor-pointer hover:opacity-80 transition-opacity` plus a focus-visible ring for affordance/keyboarding. Add `aria-label={`Open ${combatant.name} details — legendary actions`}` and a `title`.
- Alternatives considered:
  - Keep `<span role="button" tabIndex={0}>` with `onKeyDown` handling — rejected: native `<button>` gives Enter/Space activation and focus semantics for free and is the project's existing pattern (see initiative button `CombatantCard.tsx:624`, name button `:483`).
  - Wrap the `<span>` in a `<button>` — rejected: nests redundant elements; moving `data-testid` to the button is cleaner.
- Rationale: Native semantics, minimal risk, consistent with sibling controls.
- Trade-offs: One data-testid element changes tag; tests asserting `span` must update. Slight risk of layout shift from button box model, mitigated by resets + visual check.

### Decision 3: Behavior when `onShowDetails` is undefined

- Chosen: The button always renders (whenever the badge condition holds); `onClick` calls `onShowDetails?.(...)` — a safe no-op if the prop is absent. Matches the existing name button's behavior exactly.
- Alternatives considered: Render a plain `<span>` when the prop is missing — rejected: branching markup for a marginal case, and the name button does not bother.
- Rationale: Simplicity and consistency.
- Trade-offs: In prop-less contexts the button is focusable but inert. Acceptable; those contexts (setup view, isolated tests) don't show a detail panel anyway.

### Decision 4: Remove dead imports as part of this change

- Chosen: Delete the `LegendaryActionsPanel` and `LairActionsSlot` import lines (`CombatantCard.tsx:8-9`).
- Alternatives considered: Leave them / defer to #680 — rejected: #695 explicitly owns this cleanup; they mislead readers into thinking the card renders those panels.
- Rationale: Directly in scope for the issue; lint (`no-unused-vars`) likely already flags them.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Badge becomes a button that opens `CombatantDetailPanel`.
  - Design decision: Decision 1 + Decision 2.
  - Validation approach: RTL test — click `getByTestId('legendary-action-badge')`, assert `onShowDetails` called with `combatant.id`; assert element is `<button>`.
- Proposal element: No UI duplicated onto the card; no new props.
  - Design decision: Decision 1 (reuse `onShowDetails`), Non-Goals.
  - Validation approach: Diff review; `CombatantCardProps` unchanged; no `ActiveCombatView` edit in the change.
- Proposal element: Keyboard accessible with an accessible name.
  - Design decision: Decision 2 (native `<button>` + `aria-label`).
  - Validation approach: RTL test — `getByRole('button', { name: /legendary actions/i })`; fire `keyDown` Enter/Space (or `userEvent.keyboard`) and assert handler fires.
- Proposal element: Preserve `data-testid` and `N/M` text.
  - Design decision: Decision 2.
  - Validation approach: RTL test — badge still shows `⚡ 2/3` for `{legendaryActionsRemaining: 2, legendaryActionCount: 3}`.
- Proposal element: Safe when `onShowDetails` omitted.
  - Design decision: Decision 3.
  - Validation approach: RTL test — render without `onShowDetails`, click badge, assert no throw.
- Proposal element: Remove dead imports.
  - Design decision: Decision 4.
  - Validation approach: `grep -n "LegendaryActionsPanel\|LairActionsSlot" lib/components/CombatantCard.tsx` returns nothing; `npm run lint` clean; `npm run test:unit` green.

## Functional Requirements Mapping

- Requirement: The legendary-action badge is an interactive control that opens the combatant's detail panel.
  - Design element: Decision 1, Decision 2.
  - Acceptance criteria reference: `specs/combatant-card/spec.md` — "Legendary-action badge opens the detail panel".
  - Testability notes: RTL click + `onShowDetails` mock assertion; assert first arg equals `combatant.id`.
- Requirement: The badge remains visible only when the combatant has a non-zero legendary-action count, and still displays remaining/total.
  - Design element: Existing render guard `(combatant.legendaryActionCount ?? 0) > 0`, unchanged.
  - Acceptance criteria reference: same spec — "Badge visibility and content unchanged".
  - Testability notes: RTL — assert absent for count 0/undefined; assert text for a populated combatant.
- Requirement: The badge is operable by keyboard and exposes an accessible name.
  - Design element: Decision 2.
  - Acceptance criteria reference: same spec — "Badge is keyboard operable".
  - Testability notes: `getByRole('button', { name: ... })`; keyboard activation test.
- Requirement: With no detail-panel handler supplied, activating the badge does nothing and does not error.
  - Design element: Decision 3.
  - Acceptance criteria reference: same spec — "Badge is inert without a handler".
  - Testability notes: render without prop; click; assert no exception, no side effects.
- Requirement: `CombatantCard` no longer imports `LegendaryActionsPanel` or `LairActionsSlot`.
  - Design element: Decision 4.
  - Acceptance criteria reference: same spec — "Dead imports removed".
  - Testability notes: static grep + lint.

## Non-Functional Requirements Mapping

- Requirement category: operability / maintainability
  - Requirement: No change to `CombatantCard`'s public prop contract or to `ActiveCombatView` wiring; existing combat test suites stay green.
  - Design element: Decision 1 (reuse existing prop).
  - Acceptance criteria reference: `specs/combatant-card/spec.md` NFAC — "No prop-contract change".
  - Testability notes: `npm run test:unit` for combat/ActiveCombatView suites passes unchanged; TypeScript `CombatantCardProps` diff is empty.
- Requirement category: security
  - Requirement: No new data flow, network call, external input, or state mutation is introduced.
  - Design element: Change is confined to a presentational event handler that calls an existing callback with an existing id.
  - Acceptance criteria reference: NFAC Security — see functional scenario "Legendary-action badge opens the detail panel" (no additional scenario; nothing security-relevant added).
  - Testability notes: diff review confirms no fetch/storage/`onUpdate` calls added.

## Risks / Trade-offs

- Risk/trade-off: Existing `CombatantCard` tests assert the badge is a `<span>` or assert exact markup.
  - Impact: False test failures.
  - Mitigation: Audit `tests/unit/components/CombatantCard*.test.tsx` (and any `ActiveCombatView` tests referencing `legendary-action-badge`) first; update tag expectations, keep text assertions.
- Risk/trade-off: `<button>` box model causes minor layout shift in the card header flex row.
  - Impact: Small visual regression.
  - Mitigation: Tailwind resets (`p-0 border-0 bg-transparent leading-none`); verify with `openwolf designqc` before/after.
- Risk/trade-off: Two controls (name button, badge) open the same panel at slightly different positions.
  - Impact: Cosmetic.
  - Mitigation: Use identical position shape; adjust only if designqc shows an off-screen/overlapping panel.
- Risk/trade-off: Scope creep toward auto-scrolling the panel to the legendary section.
  - Impact: Touches `CombatantDetailPanel`, larger change.
  - Mitigation: Explicit Non-Goal; capture as follow-up if requested.

## Rollback / Mitigation

- Rollback trigger: Visual regression on the card header, unexpected detail-panel behavior, or combat suite failures that cannot be quickly resolved.
- Rollback steps: Revert the single commit on `lib/components/CombatantCard.tsx` and its test file(s); the branch/PR is isolated and not depended upon.
- Data migration considerations: None — no schema, storage, or state changes.
- Verification after rollback: `npm run test:unit` green; badge renders as before (`<span>`, no interactivity).

## Operational Blocking Policy

- If CI checks fail: Diagnose from the failing job log, fix on the branch, push, re-run. Lint failures for the removed imports should instead disappear.
- If security checks fail (Verity / security-review): Address the finding; this change adds no new input handling, so a security finding here is most likely unrelated or a false positive — if a false positive, use `verity feedback finding <run-id> <pattern-id> false_positive`, never a self-authored waive.
- If required reviews are blocked/stale: Follow the tasks.md PR-and-merge loop — spawn `pr-review-toolkit:review-pr`, address findings, re-request. After 3 no-progress iterations, stop and report remaining findings to the user.
- Escalation path and timeout: If blocked > 1 working day with no path forward, summarize the blocker on the PR and in chat and wait for Doug's guidance. Never force-merge; never use `--admin`.

## Open Questions

- Should the detail panel auto-scroll/focus to the Legendary Actions section when opened from the badge? Default for this change: no (open only). Not a blocker for apply.
- Should the badge also be interactive for combatants that only have `lairActions`? Default: no — legendary-only, per issue #695 option C. Not a blocker for apply.
