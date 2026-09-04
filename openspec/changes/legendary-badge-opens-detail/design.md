## Context

- Relevant architecture:
  - `lib/components/CombatantCard.tsx` (`'use client'`, ~883 lines) renders one combatant row. It exposes an optional `onShowDetails?: (combatantId: string, position: { top: number; left: number }) => void` prop (`CombatantCard.tsx:23`), invoked by the combatant-name button (`CombatantCard.tsx:483-486`) to open the detail panel.
  - The legendary-action badge is a non-interactive `<span data-testid="legendary-action-badge">` at `CombatantCard.tsx:551-558`, rendered only when `(combatant.legendaryActionCount ?? 0) > 0`, showing `⚡ {remaining}/{count}`.
  - `lib/components/ActiveCombatView.tsx` owns detail-panel state: `selectedDetailCombatantId`, `detailPosition`. It passes `onShowDetails={(id, pos) => { setSelectedDetailCombatantId(id); setDetailPosition(pos); }}` to `<CombatantCard>` (`ActiveCombatView.tsx:173-176`) and renders `<CombatantDetailPanel>` at `ActiveCombatView.tsx:393-400`, gated on `selectedDetailCombatantId && detailPosition`.
  - `lib/components/CombatantDetailPanel.tsx` is one scroll container (`absolute … max-h-[85vh] overflow-y-auto`, `CombatantDetailPanel.tsx:41-45`). Its props are `combatant`, `detailPosition`, `onClose`, `onUpdate` (`CombatantDetailPanel.tsx:6-11`). It renders `<LegendaryActionsPanel combatant onUpdate>` at `CombatantDetailPanel.tsx:95-98` as a bare child with no id/ref/anchor.
  - `lib/components/LegendaryActionsPanel.tsx` returns `null` when `combatant.legendaryActions` is missing/empty (`LegendaryActionsPanel.tsx:18`); otherwise renders the `LEGENDARY ACTIONS` heading, a `Restore All` button (`data-testid="legendary-action-restore"`), a pool editor (`data-testid="legendary-action-pool-editor"`), and per-action `Use` buttons.
  - Lair actions have a separate initiative-order entry via `<LairActionsSlot>` in `ActiveCombatView` for `type === 'lair'` combatants — untouched here.
  - `CombatantCard.tsx:8-9` imports `LegendaryActionsPanel` and `LairActionsSlot` but never renders them (dead imports).
- Dependencies:
  - React 18 + Next.js app-router client components; Tailwind CSS.
  - Tests: React Testing Library + Jest, `npm run test:unit` (no `npm test` script). jsdom does **not** implement `Element.prototype.scrollIntoView`.
- Interfaces/contracts touched:
  - `CombatantCard` `onShowDetails` prop: widened additively to `(combatantId, position, options?: { focusSection?: 'legendary' }) => void`. All existing call sites and mocks remain valid (extra arg is optional and ignored by current handlers).
  - `CombatantDetailPanel` props: new optional `focusSection?: 'legendary'`.
  - `CombatantDetailPanel` DOM: a new wrapper element around `<LegendaryActionsPanel>` carrying a ref (and `data-testid="detail-legendary-section"`).
  - `CombatantCard` badge DOM: `<span data-testid="legendary-action-badge">` → `<button type="button" data-testid="legendary-action-badge">`.
  - No change to `CombatantState`, combat reducers/utils, persistence, or `onUpdate`.

## Goals / Non-Goals

### Goals

- Make the legendary-action badge a discoverable, keyboard-accessible button that opens `CombatantDetailPanel`.
- When opened from the badge (and only then), the panel scrolls the Legendary Actions section into view and moves keyboard focus into it.
- The combatant-name open path is byte-for-byte unchanged.
- Preserve the badge's appearance, `R/N` text, `data-testid`, and visibility guard.
- Remove the two dead imports from `CombatantCard.tsx`.
- Legendary-only: no lair affordance on the card.

### Non-Goals

- No legendary/lair controls on the card itself.
- No `CombatantDetailPanel` restructuring beyond the anchor + on-request scroll/focus.
- No generic "link to any section" mechanism — only `focusSection: 'legendary'`.
- No edits to `LegendaryActionsPanel.tsx`.
- Not part of the #680 decomposition.

## Decisions

### Decision 1: Widen `onShowDetails` with an optional `options` argument rather than adding a second prop

- Chosen: `onShowDetails?: (combatantId: string, position: { top: number; left: number }, options?: { focusSection?: 'legendary' }) => void`. The badge calls it with `{ focusSection: 'legendary' }`; the name button calls it unchanged (two args).
- Alternatives considered:
  - Separate `onShowLegendaryDetails` prop — rejected: two near-identical props to thread and wire; more surface on an oversized component.
  - Card-local state to scroll a panel it doesn't own — rejected: panel lifecycle/render belongs to `ActiveCombatView`.
  - Encode the intent in `position` — rejected: overloading a geometry arg is opaque.
- Rationale: One entry point, additive change, existing callers/tests untouched.
- Trade-offs: `onShowDetails`'s type surface grows slightly. The NFAC is revised from "no prop-contract change" to "additive-only contract change; existing callers unaffected".

### Decision 2: `<span>` → `<button type="button">`, styled to preserve appearance

- Chosen: Replace the `<span>` with `<button type="button">`, keep `data-testid="legendary-action-badge"` and the `⚡ {remaining}/{count}` content. Tailwind resets (`p-0 border-0 bg-transparent leading-none`), keep `text-sm font-semibold text-amber-400 whitespace-nowrap`, add `cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400`. `aria-label={`Open ${combatant.name} details — legendary actions`}`, plus `title`.
- Alternatives considered: `<span role="button" tabIndex={0}>` with manual `onKeyDown` — rejected: native `<button>` gives Enter/Space + focus semantics free and matches sibling controls (`CombatantCard.tsx:483`, `:624`).
- Rationale: Native semantics, minimal risk, consistent.
- Trade-offs: One `data-testid` element changes tag; tests asserting `span` update (audit shows current tests query by testid/text only — low risk). Minor layout-shift risk mitigated by resets + visual check.

### Decision 3: Scroll anchor lives in `CombatantDetailPanel`, not `LegendaryActionsPanel`

- Chosen: In `CombatantDetailPanel`, wrap `<LegendaryActionsPanel>` in `<div ref={legendaryRef} data-testid="detail-legendary-section">`. `LegendaryActionsPanel.tsx` is not modified.
- Alternatives considered: Add `id="…"` inside `LegendaryActionsPanel` — rejected: couples an unrelated component to this feature and its "returns null when empty" branch complicates a stable anchor.
- Rationale: The composition point already knows the section exists and owns the panel's scroll container.
- Trade-offs: The wrapper `<div>` is always present even when `LegendaryActionsPanel` renders null; harmless (empty div). Scroll effect guards on "does the wrapper have rendered content / does ref exist".

### Decision 4: `CombatantDetailPanel` performs scroll + focus in an effect, opt-in via `focusSection`

- Chosen: New optional prop `focusSection?: 'legendary'`. A `useEffect` keyed on `[combatant.id, focusSection]` runs when `focusSection === 'legendary'`: if `legendaryRef.current` exists and contains focusable content, call `legendaryRef.current.scrollIntoView?.({ block: 'start' })` (guarded) then move focus — preferring the first focusable control inside the section (`Restore All` / pool `−`), falling back to focusing the wrapper via `tabIndex={-1}`. When `focusSection` is undefined the effect does nothing.
- Alternatives considered:
  - Do it in `ActiveCombatView` after render — rejected: needs a ref into the panel's subtree; the panel is the right owner.
  - `scrollIntoView` only, no focus move — rejected: keyboard/SR users get no benefit; the requester asked for "auto scroll and focus".
  - Imperative handle / callback ref up to `ActiveCombatView` — rejected: more plumbing than a prop + effect.
- Rationale: Declarative, testable, contained; keyed effect re-runs when the same panel is re-opened to a different/again section.
- Trade-offs: Re-open-while-open re-focus needs the key to actually change. Since `focusSection` may be `'legendary'` both times, `ActiveCombatView` also bumps a `detailRequestNonce` (or sets `focusSection` back to `undefined` on close so the next open is a real transition). Chosen: clear `detailFocusSection` on close (it is cleared with `selectedDetailCombatantId` already), which makes every badge-open a `undefined → 'legendary'` transition.

### Decision 5: `ActiveCombatView` tracks `detailFocusSection` alongside the existing detail state

- Chosen: Add `const [detailFocusSection, setDetailFocusSection] = useState<'legendary' | undefined>()`. In the `onShowDetails` handler: `setSelectedDetailCombatantId(id); setDetailPosition(pos); setDetailFocusSection(options?.focusSection)`. On close (`onClose` at `ActiveCombatView.tsx:400`): also `setDetailFocusSection(undefined)`. Pass `focusSection={detailFocusSection}` to `<CombatantDetailPanel>`.
- Alternatives considered: Derive from a URL param / context — rejected: overkill, no routing involved.
- Rationale: Mirrors the existing `detailPosition` state exactly; smallest possible diff.
- Trade-offs: One more `useState` in a component that already has several; acceptable.

### Decision 6: Remove dead imports as part of this change

- Chosen: Delete `CombatantCard.tsx:8-9` (`LegendaryActionsPanel`, `LairActionsSlot` imports).
- Rationale: Explicitly in scope for #695; lint likely already flags them.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Badge becomes a button that opens `CombatantDetailPanel`.
  - Design decision: Decision 1, Decision 2, Decision 5.
  - Validation approach: RTL — click `getByTestId('legendary-action-badge')`; assert `onShowDetails` called with `(combatant.id, {top,left}, { focusSection: 'legendary' })`; assert element is `<button>`.
- Proposal element: Opening from the badge scrolls + focuses the Legendary Actions section.
  - Design decision: Decision 3, Decision 4, Decision 5.
  - Validation approach: RTL on `CombatantDetailPanel` with `focusSection="legendary"` — mock `Element.prototype.scrollIntoView`, assert it was called on the section wrapper and that focus (`document.activeElement`) is within `getByTestId('detail-legendary-section')`. RTL integration on `ActiveCombatView` — click badge, panel appears, scrollIntoView called.
- Proposal element: Name-button path unchanged.
  - Design decision: Decision 4 (opt-in), Decision 5 (nonce cleared on close).
  - Validation approach: RTL — open panel via name button (no `focusSection`); assert `scrollIntoView` not called and focus not forced into the section.
- Proposal element: Legendary-only; no lair affordance.
  - Design decision: Scope / Non-Goals; badge guard unchanged (`legendaryActionCount > 0`).
  - Validation approach: RTL — a combatant with only `lairActions` (no `legendaryActionCount`) renders no badge.
- Proposal element: Preserve `data-testid`, `R/N` text, visibility guard, accessible name, keyboard operability.
  - Design decision: Decision 2.
  - Validation approach: RTL — text `2/3`; `getByRole('button', { name: /legendary actions/i })`; keyboard Enter/Space; absent for count 0/undefined.
- Proposal element: Empty `legendaryActions` with `legendaryActionCount > 0`.
  - Design decision: Decision 3 (guard), Decision 4 (guard on ref content).
  - Validation approach: RTL — badge present, panel opens, no throw, `scrollIntoView` a no-op / not asserted.
- Proposal element: Remove dead imports.
  - Design decision: Decision 6.
  - Validation approach: `grep` returns nothing; `npm run lint` clean.

## Functional Requirements Mapping

- Requirement: The legendary-action badge is an interactive control that opens the combatant's detail panel and requests focus on the legendary section.
  - Design element: Decisions 1, 2, 5.
  - Acceptance criteria reference: `specs/legendary-action-tracking/spec.md` — "Counter badge visible in combatant row" (MODIFIED) → scenario "Activating the badge opens the detail panel focused on legendary actions".
  - Testability notes: RTL click + `onShowDetails` mock; assert third arg `{ focusSection: 'legendary' }`.
- Requirement: `CombatantDetailPanel` scrolls + moves focus to the Legendary Actions section when `focusSection === 'legendary'`.
  - Design element: Decisions 3, 4.
  - Acceptance criteria reference: same spec — scenario "Detail panel focuses the legendary section on request".
  - Testability notes: mock `scrollIntoView`; assert call + `activeElement` containment.
- Requirement: Opening the panel any other way is unaffected (no scroll, no focus move).
  - Design element: Decision 4 (opt-in), Decision 5 (clear on close).
  - Acceptance criteria reference: same spec — scenario "Opening the panel from the name control does not force scroll or focus".
  - Testability notes: render panel without `focusSection`; assert `scrollIntoView` not called.
- Requirement: Badge remains visible only for `legendaryActionCount > 0` and still shows `R/N`.
  - Design element: Existing guard, unchanged.
  - Acceptance criteria reference: same spec — scenarios "Badge renders for legendary monster", "Badge absent for non-legendary combatants", "Badge updates after use".
  - Testability notes: RTL presence/absence + text.
- Requirement: Badge is keyboard operable with an accessible name.
  - Design element: Decision 2.
  - Acceptance criteria reference: same spec — NFAC Accessibility "Badge is operable without a pointer".
  - Testability notes: `getByRole('button', { name })`; keyboard activation.
- Requirement: Badge is inert (safe no-op) when no `onShowDetails` handler is supplied.
  - Design element: Decision 1 (`onShowDetails?.(...)`).
  - Acceptance criteria reference: same spec — scenario "Badge is inert without a handler".
  - Testability notes: render without prop; activate; assert no throw.
- Requirement: `CombatantCard` no longer imports `LegendaryActionsPanel` / `LairActionsSlot`.
  - Design element: Decision 6.
  - Acceptance criteria reference: same spec — traceability note (static check).
  - Testability notes: grep + lint.

## Non-Functional Requirements Mapping

- Requirement category: operability / maintainability
  - Requirement: The `onShowDetails` contract change is additive only; every existing caller and test keeps working without modification (other than badge tests that hard-coded the `span` tag, of which the audit finds none). The existing name-button open path is behaviourally identical.
  - Design element: Decisions 1, 4, 5.
  - Acceptance criteria reference: `specs/legendary-action-tracking/spec.md` NFAC "Backward-compatible contract".
  - Testability notes: `npm run test:unit` for combat / `CombatantCard` / `ActiveCombatView` / `CombatantDetailPanel` suites passes; name-button regression test green; TypeScript compiles with the widened signature.
- Requirement category: reliability
  - Requirement: The scroll/focus behavior degrades gracefully where `scrollIntoView` is unavailable or the section has no content.
  - Design element: Decisions 3, 4 (guards: `ref.current?.scrollIntoView?.()`, focusable-child check).
  - Acceptance criteria reference: same spec — scenario "Focus request with no legendary content is a safe no-op".
  - Testability notes: render `CombatantDetailPanel` with `focusSection="legendary"` and a combatant whose `legendaryActions` is empty; assert no throw.
- Requirement category: accessibility
  - Requirement: Keyboard/SR users benefit from the badge (operable, named) and from the focus move (focus lands on a real control in the section, not lost).
  - Design element: Decisions 2, 4.
  - Acceptance criteria reference: same spec — NFAC Accessibility.
  - Testability notes: role query + `activeElement` assertion.
- Requirement category: security
  - Requirement: No new input handling, network calls, or state mutation. The badge invokes an existing in-process callback with an existing id and a literal `'legendary'`; the panel calls DOM APIs on its own subtree.
  - Design element: whole change is presentational.
  - Acceptance criteria reference: NFAC Security — cross-references the functional scenarios; no distinct scenario.
  - Testability notes: diff review confirms no fetch/storage/`onUpdate` added.

## Risks / Trade-offs

- Risk/trade-off: Three files change instead of one; risk of regressing the name-button open path.
  - Impact: Behavior change for the common open path.
  - Mitigation: `focusSection` strictly opt-in; explicit regression test for the name-button path; `detailFocusSection` cleared on close.
- Risk/trade-off: jsdom lacks `scrollIntoView`; browser focus/scroll differences.
  - Impact: Test friction; potential no-op in edge environments.
  - Mitigation: Guard the call; mock in tests; assert on intent (call made, focus target) not on pixel scroll.
- Risk/trade-off: `<button>` box model shifts the card header row.
  - Impact: Minor visual regression.
  - Mitigation: Tailwind resets; `openwolf designqc` before/after.
- Risk/trade-off: Re-clicking the badge while the panel is already open must re-focus the section.
  - Impact: Second click feels dead.
  - Mitigation: Decision 4/5 — clear `detailFocusSection` on close and rely on `undefined → 'legendary'` transitions; if product later wants re-focus without close, add a request nonce (noted, not built).
- Risk/trade-off: Existing tests assert badge is a `<span>` / exact markup.
  - Impact: False failures.
  - Mitigation: Audit `tests/unit/components/CombatantCard*.test.tsx` + `combat.spec.ts` first (audit result: they query by `data-testid` / text only).

## Rollback / Mitigation

- Rollback trigger: Visual regression on the card header, broken/flaky detail-panel tests, focus-management complaints, or combat-suite failures not quickly resolved.
- Rollback steps: Revert the single feature commit (touches `CombatantCard.tsx`, `ActiveCombatView.tsx`, `CombatantDetailPanel.tsx`, and their tests). Branch/PR is isolated and not depended upon.
- Data migration considerations: None — no schema, storage, or state-shape changes.
- Verification after rollback: `npm run test:unit` green; badge renders as a `<span>`, panel opens at top with no forced scroll/focus.

## Operational Blocking Policy

- If CI checks fail: Diagnose from the failing job log, fix on the branch, push, re-run. Lint failures for the removed imports should disappear.
- If security checks fail (Verity / security-review): Address the finding. This change adds no new input handling, so a security finding is most likely unrelated or a false positive — if a false positive, `verity feedback finding <run-id> <pattern-id> false_positive`, never a self-authored waive.
- If required reviews are blocked/stale: Follow the tasks.md PR loop — spawn `pr-review-toolkit:review-pr`, address findings, re-request. After 3 no-progress iterations, stop and report remaining findings to the user.
- Escalation path and timeout: If blocked > 1 working day with no path forward, summarize the blocker on the PR and in chat and wait for Doug's guidance. Never force-merge; never `--admin`.

## Open Questions

None. Both explore-session questions are resolved (auto-scroll + focus: yes; legendary-only: yes). If, during implementation, moving focus into the panel proves disruptive in manual testing, fall back to `scrollIntoView` only plus focusing the panel's close button — note it on the PR; not a blocker.
