## Context

- Relevant architecture:
  - `lib/components/ActiveCombatView.tsx` renders the initiative order (`getDisplayCombatants().map(...)`) and owns the `nextTurn` wiring passed into each `CombatantCard`/`LairActionsSlot` as `onNextTurn`.
  - `lib/hooks/useCombat.ts` owns `combatState` and exposes `nextTurn()`, which advances `combatState.currentTurnIndex` to the next combatant with `hp > 0` (or a lair slot), skipping downed combatants and wrapping the round.
  - `lib/components/combatant-card/CombatantCardHeader.tsx` renders the "Current Turn (done)" button, visible only when `isActive`, calling `onNextTurn` on click.
  - Every rendered card already carries `data-combatant-id="<id>"` (used today by `ActiveCombatView.tsx`'s `getCardAnchorPosition` to anchor the initiative modal), giving a ready-made DOM hook for scroll targeting.
  - `lib/preferences/schema.ts` defines a typed, versioned `PreferenceValues` shape with per-key validators (`KEY_VALIDATORS`), sparse-delta resolution (`resolvePreferences`), and patch validation (`validatePreferencePatch`), currently covering `dice.*` and `chat.*`.
  - `lib/preferences/usePreferences.tsx` is an offline-first provider: it renders from a local mirror (localStorage-backed, per [[project_user_preference_persistence_619]]) immediately, then reconciles with the server.
  - `app/api/me/preferences/route.ts` + `lib/storage/userPreferencesRepo.ts` handle the authenticated PATCH/GET round-trip and Mongo persistence as a sparse `preferences.values.<path>` document, per-user.
  - `app/profile/page.tsx` is the existing preferences UI (`openspec/specs/profile-settings/spec.md`), currently rendering dice and chat toggles sourced from `usePreferences()`.
- Dependencies: none new — this change adds a domain to an existing schema/pipeline rather than introducing new infrastructure.
- Interfaces/contracts touched:
  - `PreferenceValues` (new `combat` domain) — a superset-compatible, additive schema change (old clients ignore the new key; `resolvePreferences` degrades missing/invalid values to default).
  - `PATCH /api/me/preferences` — accepts the new key via the existing generic sparse-patch mechanism, no route-shape change.
  - `ActiveCombatView`'s `onNextTurn` wiring — becomes a local wrapper around `combat.nextTurn` instead of passing `nextTurn` through directly.

## Goals / Non-Goals

### Goals

- Scroll the newly-active combatant's full card into view, smoothly, immediately after a "Current Turn (done)" click — and only after that click.
- Make the behavior an opt-out user preference (default on), persisted the same way every other preference in this app is persisted.
- Keep the change additive and isolated: no modification to turn-selection logic (`nextTurn`'s skip/wrap semantics), no new state-management mechanism.

### Non-Goals

- Scrolling triggered by `restartRound`, combatant add/remove, or any other `activeCombatantId`-changing path.
- Any change to which combatant becomes active next.
- A new settings surface (the toggle lives on the existing `/profile` page).
- Cross-browser/cross-viewport pixel-perfect scroll tuning beyond a reasonable `scrollIntoView` alignment choice.

## Decisions

### Decision 1: Resolve the target combatant id by simulating the post-advance state, not by reading `combatState` after the call

- Chosen: In the wrapped click handler, compute the combatant that *will* become active using the same forward-looking approach already used in `handleSetInitiative` (`ActiveCombatView.tsx`) — derive the next index from the current `combatState` and the same skip/wrap rule `nextTurn` uses — rather than reading `combatState.currentTurnIndex` synchronously after calling `nextTurn()` (which is still the pre-update value, since React state updates aren't synchronous).
- Alternatives considered:
  - **`useEffect` keyed on `activeCombatantId`**: simpler, but fires for every cause of that value changing (`restartRound`, combatant removal reshuffling indices), violating the "only scroll on explicit done click" requirement (proposal Non-Goals) unless paired with extra guard state.
  - **Have `nextTurn` itself return the new active id**: would require changing `useCombat.ts`'s public contract, which the proposal explicitly scopes out ("don't modify `useCombat` itself") given that file is already flagged oversized by the review gate.
- Rationale: A guard-ref/flag set only inside the "done" click handler, combined with a `useEffect` that fires on `activeCombatantId` change *and* checks the guard, gives the precision of "only this trigger" without needing to duplicate `nextTurn`'s selection logic or touch `useCombat.ts`. Concretely: the click handler sets `pendingScrollRef.current = true` before calling `nextTurn()`; a `useEffect` on `[activeCombatantId]` scrolls and resets the ref only when the ref is `true`.
- Trade-offs: Slightly more indirection (ref + effect) than a single inline scroll call, but avoids both re-deriving turn-order logic in two places and widening `useCombat`'s API surface.

### Decision 2: Scroll via `element.scrollIntoView({ behavior: 'smooth', block: <alignment> })` targeting `[data-combatant-id="<id>"]`

- Chosen: Reuse the existing `data-combatant-id` attribute (already present on every rendered card) with `document.querySelector`, mirroring the pattern already used by `getCardAnchorPosition`. Call native `scrollIntoView` with `behavior: 'smooth'`; use `block: 'nearest'` as the default alignment, since it keeps the browser from over-scrolling when the target card is already partially visible, while still bringing a fully off-screen card entirely into view.
- Alternatives considered:
  - **Manual scroll math (`getBoundingClientRect` + `window.scrollTo`)**: more control, but reimplements what `scrollIntoView` already does, and native smooth scrolling is well-supported in this project's target browsers.
  - **`block: 'center'`**: always centers the card, which can be more visually jarring than necessary when the card is only slightly out of view; `'nearest'` is the closer match to "reveal the full card without unnecessary large jumps."
- Rationale: Minimal new code, uses a browser-native API, and requires no new DOM attributes.
- Trade-offs: On a card taller than the viewport (e.g. many legendary actions expanded), `scrollIntoView` cannot show the whole card regardless of alignment — accepted per proposal's Risks section as "best effort."

### Decision 3: Add `combat.autoScrollToNextCombatant: boolean` as a new top-level preference domain, default `true`

- Chosen: Extend `PreferenceValues`, `DEFAULT_PREFERENCES`, `KEY_VALIDATORS`, and `cloneDefaults()` in `lib/preferences/schema.ts` with a `combat: { autoScrollToNextCombatant: boolean }` domain, following the exact shape of the existing `chat.pinned: boolean` entry (a simple boolean, no nested object, no range validation needed).
- Alternatives considered:
  - **Nest under an existing domain (e.g. `chat`)**: rejected — `combat` is a distinct concern from chat/dice and a new domain keeps the schema self-documenting; also avoids an awkward `chat.autoScrollToNextCombatant` name.
  - **`localStorage`-only, no server persistence**: rejected — proposal explicitly requires the setting to live in both local storage and the user profile, matching every other preference in this app.
- Rationale: Zero new plumbing — `resolvePreferences`, `sparseKnownValues`, `validatePreferencePatch`, and `partitionPreferenceDelta` are all generic over `KNOWN_PATHS`, so adding one path to `KEY_VALIDATORS` extends every one of those functions for free.
- Trade-offs: None material — this is the established, low-risk extension point for exactly this kind of change.

### Decision 4: Surface the toggle on `/profile` as a new boolean control, matching the existing dice/chat toggle presentation

- Chosen: Add a labeled toggle (e.g. "Auto-scroll to next combatant") to `app/profile/page.tsx` in the same section style as the existing preference controls, wired through `usePreferences()`'s existing `setPreference`/`getPreference`-style API.
- Alternatives considered: Placing the toggle inline in the combat view itself (near the "Current Turn (done)" button) — rejected per explicit user direction that the setting belongs on `/profile`, not a new inline control.
- Rationale: Consistency with the established preferences UX; no new component pattern needed.
- Trade-offs: DM has to leave the combat view to change it (acceptable — it's a set-once-per-preference toggle, not a per-turn control).

## Proposal to Design Mapping

- Proposal element: Scroll to full newly-active card after "Current Turn (done)"
  - Design decision: Decision 1 (target resolution) + Decision 2 (scroll mechanism)
  - Validation approach: Unit test on `ActiveCombatView` simulating a click and asserting `scrollIntoView` was called on the expected element with `{ behavior: 'smooth' }`; e2e assertion (extending `tests/e2e/combat.spec.ts`) that the next-active card is in the viewport after the click.
- Proposal element: Non-directional scroll (skip-downed / round-wrap aware)
  - Design decision: Decision 1 — target id is derived from the same forward-looking selection the click is about to trigger, not from list position.
  - Validation approach: Unit test with a downed combatant interposed between current and next-eligible combatant, asserting the scroll target is the eligible one, not the immediate next DOM sibling.
- Proposal element: Scroll only on explicit "done" click, never on `restartRound`/removal
  - Design decision: Decision 1's guard-ref pattern.
  - Validation approach: Unit test asserting `scrollIntoView` is NOT called when `activeCombatantId` changes via `restartRound` or combatant removal.
- Proposal element: New `combat.autoScrollToNextCombatant` preference, default on, local + profile persisted
  - Design decision: Decision 3.
  - Validation approach: Extend `lib/preferences/schema.ts`'s existing unit test suite with the new path (valid/invalid values, default resolution, sparse delta); extend `app/api/me/preferences` route tests for the new key.
  - Design decision: Decision 4.
  - Validation approach: Extend `tests/unit/app/profile/page.test.tsx` with a new toggle scenario mirroring the existing dice/chat toggle tests.

## Functional Requirements Mapping

- Requirement: Clicking "Current Turn (done)" scrolls the new active combatant's card fully into view when the preference is enabled.
  - Design element: Decision 1 + Decision 2.
  - Acceptance criteria reference: specs — turn-advancement-auto-scroll capability, "Scenario: DM completes a turn with auto-scroll enabled".
  - Testability notes: Deterministic via a mocked `Element.prototype.scrollIntoView` (jsdom does not implement it natively) asserting call args and target.
- Requirement: When the preference is disabled, no scroll occurs.
  - Design element: Decision 1's guard checks the resolved preference value before scrolling.
  - Acceptance criteria reference: specs — "Scenario: DM completes a turn with auto-scroll disabled".
  - Testability notes: Same mock, asserting zero calls.
- Requirement: Scroll target is the next combatant able to act (skip-downed/round-wrap aware), not the next DOM sibling.
  - Design element: Decision 1.
  - Acceptance criteria reference: specs — "Scenario: Turn advances past a downed combatant".
  - Testability notes: Reuse existing turn-order-advancement fixtures (downed monster, lair slot) already present in the codebase's turn-order test data.
- Requirement: Preference is readable/writable via the existing `/profile` UI and persists across reload.
  - Design element: Decision 3 + Decision 4.
  - Acceptance criteria reference: specs — profile-settings capability, new scenario alongside existing dice/chat scenarios.
  - Testability notes: Extend existing `page.test.tsx` mocking pattern for `usePreferences`.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: The scroll wrapper must not add a measurable render-path cost to `ActiveCombatView`, which is already large.
  - Design element: A single small ref + one `useEffect` + one `querySelector` call, scoped to firing only on the "done" click path.
  - Acceptance criteria reference: design Decision 1.
  - Testability notes: No new re-render loops introduced; existing render-count assertions in `ActiveCombatView` unit tests should remain unaffected — verify no new failing/flaky assertions there.
- Requirement category: reliability
  - Requirement: Missing/unreachable preferences (offline, API error) must not throw and must default to current "scroll on" behavior via the existing offline-first fallback (`useFallbackPreferences`/local mirror).
  - Design element: Reuses `usePreferences()`'s existing default-resolution path — no new fallback logic needed.
  - Acceptance criteria reference: specs — "Scenario: Preference unresolved falls back to default (on)".
  - Testability notes: Test the resolved-value read path directly against `DEFAULT_PREFERENCES.combat.autoScrollToNextCombatant === true`.
- Requirement category: comprehensibility (project-specific gate)
  - Requirement: New logic must not meaningfully worsen the existing MEDIUM comprehensibility findings on `ActiveCombatView.tsx` and `useCombat.ts`.
  - Design element: Decision 1 keeps all new logic in one small, named helper/effect block inside `ActiveCombatView.tsx`, and explicitly avoids touching `useCombat.ts` at all.
  - Acceptance criteria reference: tasks.md size-budget note; Verity gate result at PR time.
  - Testability notes: Not unit-testable directly — verify by keeping the diff to `ActiveCombatView.tsx` small and isolated, and checking the Verity report on the resulting PR.

## Risks / Trade-offs

- Risk/trade-off: Guard-ref approach (Decision 1) is slightly more complex than a naive `useEffect` on `activeCombatantId`.
  - Impact: One more piece of state to reason about.
  - Mitigation: Keep it as a single boolean ref with a clear comment explaining why it exists (mirrors the existing commenting style already used for similar guards in this file, e.g. `dismissedInitiativeIds`).
- Risk/trade-off: `scrollIntoView` is unmockable via real browser behavior in jsdom (not implemented) — tests must mock it.
  - Impact: Unit tests validate call-was-made-correctly, not actual visual scroll position.
  - Mitigation: Cover real scroll behavior via the e2e suite (`tests/e2e/combat.spec.ts`), which runs in a real browser (Playwright), already referenced for the "Current Turn (done)" button.
- Risk/trade-off: Adding a `combat` domain touches four shared files in the preference pipeline (schema, provider, route, repo).
  - Impact: A broader diff than a single-file change, though each file's edit is additive and small.
  - Mitigation: Follow the `chat.pinned` boolean exactly as a template at each layer to minimize decision-making/risk of divergence.

## Rollback / Mitigation

- Rollback trigger: Auto-scroll behavior reported as janky/incorrect in production, or the new preference domain causes unexpected `PATCH /api/me/preferences` failures.
- Rollback steps: Revert the `ActiveCombatView.tsx` wrapper (restores direct `onNextTurn={nextTurn}` wiring) and the `/profile` toggle addition. The preference schema addition can remain even if UI/behavior is reverted — it is additive and inert (unread) with no data-migration implications; alternatively revert the full PR if bundled as one commit.
- Data migration considerations: None — sparse-delta storage means removing the `combat` domain from the schema later would simply cause `resolvePreferences` to drop any previously-stored `combat.autoScrollToNextCombatant` values on next read (self-cleaning, no migration script needed).
- Verification after rollback: Manually re-run the "Current Turn (done)" click in combat and confirm no scroll occurs and no console errors; confirm `/profile` renders without the removed toggle.

## Operational Blocking Policy

- If CI checks fail: Fix the underlying issue before merge; do not bypass with admin merge or `--no-verify` (per project convention — [[feedback_no_admin_merge]]).
- If security checks fail: This change touches no auth, network-input-parsing, or privileged-write paths beyond the existing authenticated preferences PATCH route (unchanged trust boundary) — any security finding should be treated as a real regression and investigated, not waived.
- If required reviews are blocked/stale: Address reviewer comments before merge; do not force-push over unresolved feedback (per project convention — [[feedback_resolve_pr_comments]]).
- Escalation path and timeout: Standard project PR review — no special escalation needed for a change of this size; the change is self-contained and revertible per the Rollback section above.

## Open Questions

None — all design-level questions are resolved by the decisions above; no unresolved ambiguity remains for apply.
