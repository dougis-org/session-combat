## Context

- Relevant architecture:
  - `lib/components/GlobalDiceFab.tsx` — owns roll state. `performRoll(built)` decides the outcome, optionally persists it, then `setOverlayRoll(built)`. Renders `<DiceRollOverlay>` when `overlayRoll` is set. `runAnimation` currently does `void animation.run(overlayRoll, container)` (fire-and-forget).
  - `lib/components/dice/DiceRollOverlay.tsx` — body-level portal (decision n047). Renders a full-viewport dimmed backdrop, a `#dice-roll-canvas` mount (`absolute inset-0`, `pointer-events-none`), and the result modal (`role="dialog"`) — modal renders unconditionally. Escape / outside-click handlers run in capture phase and `stopPropagation` so the panel's own close does not also fire.
  - `lib/dice/useDiceAnimation.ts` — lazily imports `@3d-dice/dice-box`, probes WebGL once per mount, builds a `DiceBox` with `{ container, assetPath, theme }`, `await box.init()` with a 6s timeout, then `await box.roll(toDiceBoxNotation(built))`. Latches `status: 'unsupported'` for persistent failures; transient roll failures tear down without latching.
  - `lib/dice/toDiceBoxNotation.ts` — pure mapping of a `BuiltRoll` to dice-box predetermined notation; caps the animated subset at `DICE_ANIM_CAP = 30`.
- Dependencies:
  - `@3d-dice/dice-box@^1.1.4` — config keys used today: `container`, `assetPath`, `theme`. Available and relevant: `scale` (default 5), `settleTimeout` (default 5000ms), `onRollComplete(results)` callback; `roll()` returns a promise that resolves when dice settle.
  - React 18 client components; Tailwind for layout; `react-dom` `createPortal`.
- Interfaces/contracts touched:
  - `DiceAnimation.run(built, container)` return contract — today resolves after `box.roll()` or immediately on the instant path. Stays a `Promise<void>` that resolves **only when the tumble has settled or the instant path was taken**; callers may now rely on that timing.
  - `DiceRollOverlayProps` — gains no required prop change to callers that is behaviorally breaking, but adds an internal "modal revealed" state and a completion signal wired from `GlobalDiceFab`.
  - `toDiceBoxNotation` — `DICE_ANIM_CAP` constant value changes 30 -> 15 (exported; referenced by tests and spec).
  - `openspec/specs/global-dice-fab/spec.md` — MODIFIED requirement.

## Goals / Non-Goals

### Goals

- Dice faces render at roughly the modal total's `text-5xl` size (~500% larger than today).
- The dice animation is horizontally centered and dice settle in the clear space directly above the result modal, both visible together.
- The result modal is hidden until the animation completes; shown immediately on the `disableAnimation` / WebGL-unsupported / instant paths.
- A safety timeout guarantees the modal is eventually revealed even if the animation never signals completion.
- Cap the animated subset at 15 dice; progressively shrink the dice when more than 6 animate.
- Keep the change presentational: no new randomness, no network calls, `built.total` / `built.rolls` untouched.

### Non-Goals

- Frame-accurate cross-client animation.
- Animation when WebGL/assets are unavailable.
- Reworking dice themes, colors, sound, or camera choreography beyond size / centering / landing.
- Changing `disableAnimation` resolution or persistence.
- Reflecting per-die values for dice beyond the 15-die animated cap.

## Decisions

### Decision 1: Size the dice with a fixed dice-box `scale` inside a bounded, centered canvas container

- Chosen: Pass an explicit `scale` constant to `DiceBox` (single named constant, e.g. `DICE_BASE_SCALE`), and change the canvas mount from `absolute inset-0` to a bounded element that is horizontally centered and occupies the vertical band above the modal (size expressed in viewport units with a `max` cap). Apparent die size is a function of `scale` and container size; tuning both gives ≈ `text-5xl`.
- Alternatives considered:
  - `scale` alone on the full-viewport canvas: rejected — needs an extreme value and dice still scatter across the whole screen, not above the modal.
  - Runtime camera / zoom control: rejected — not exposed by dice-box `^1.1.4` in a stable way; adds per-frame work.
  - CSS `transform: scale()` on the canvas: rejected — scales rasterized output, blurs the dice, and breaks pointer-coordinate math.
- Rationale: A bounded container is also the mechanism for Decision 3 (landing position); one structural change serves both. `scale` stays a declarative constant, easy to tune and test.
- Trade-offs: Exact size is empirical and viewport-dependent; mitigated by viewport-unit sizing and a documented tuning step.

### Decision 2: Gate the result modal on an explicit "animation complete" signal, with a fallback timeout

- Chosen: `DiceRollOverlay` holds internal state `modalRevealed` (initially `false`). It is set `true` when any of: (a) `disableAnimation` is `true` (immediately), (b) the animation `status` is `'unsupported'` (immediately), (c) the animation-complete signal fires, or (d) a fallback timeout (`MODAL_REVEAL_FALLBACK_MS`) elapses — sized to comfortably exceed
`useDiceAnimation`'s dice-box init timeout (~6s) plus a typical tumble (~12000ms) so a slow
cold-cache engine load is not torn down mid-animation. The completion signal is the resolution of `animation.run(...)` promise, surfaced by `GlobalDiceFab` awaiting it and passing a `animationComplete` boolean (or an `onAnimationSettled` callback) to the overlay. `useDiceAnimation.run` is adjusted so its promise resolves **after** settle (it already awaits `box.roll()`; ensure the instant/teardown paths also resolve, never hang).
- Alternatives considered:
  - Keep `void animation.run()` and use only a timer: rejected — either reveals too early (bad) or too late (sluggish).
  - Wire dice-box `onRollComplete` directly into the overlay: rejected — the overlay does not own the `DiceBox`; keeping the box inside `useDiceAnimation` preserves the single-instance invariant.
- Rationale: The promise already encodes settle timing; the overlay just needs to know. The fallback timeout is the reliability backstop for context loss / backgrounded tabs.
- Trade-offs: Focus moves into `role="dialog"` later (during/after the tumble). The panel's inline `formula → [rolls] = total` line still renders immediately, so non-visual users get the result without waiting. Documented in Risks.

### Decision 3: Land the dice in the clear zone directly above the modal

- Chosen: In `DiceRollOverlay`, lay out the portal contents as a vertical stack centered on screen: the bounded dice canvas on top, the result modal beneath it, with a small gap. The canvas container's own bottom edge (its physics "floor") sits a fixed margin above the modal. dice-box scatters dice across that floor, so they naturally come to rest just above the modal. The modal occupies its natural size; the canvas takes the remaining vertical space up to a cap.
- Alternatives considered:
  - Full-screen canvas with dice thrown toward a target point: rejected — dice-box has no "aim at coordinate" API in this version.
  - Canvas overlapping the modal: rejected — issue #596 requires both visible simultaneously; dice must not obscure the total.
- Rationale: Container geometry is the only reliable lever over where dice rest in dice-box `^1.1.4`.
- Trade-offs: On very short viewports the clear zone shrinks; Decision 4 (down-scaling) and the 15-cap are the mitigations.

### Decision 4: Cap animated dice at 15 and shrink dice when more than 6 animate

- Chosen: Lower `DICE_ANIM_CAP` in `lib/dice/toDiceBoxNotation.ts` from 30 to 15. Add a pure helper (e.g. `diceAnimationScale(count: number): number` in `lib/dice/useDiceAnimation.ts` or a sibling module) returning `DICE_BASE_SCALE` for `count <= 6` and a monotonically decreasing value for `7..15` (clamped at a sensible floor). `useDiceAnimation.run` computes the count from the built roll's animated subset and passes the resulting `scale` into the `DiceBox` config.
- Alternatives considered:
  - Keep 30, only down-scale: rejected — requester specified 15.
  - Linear shrink starting at 1 die: rejected — requester specified the threshold is "more than 6".
  - Down-scale continuously past 15: unnecessary — nothing beyond 15 animates.
- Rationale: Fewer, larger dice read better; the curve keeps 15 dice inside the clear zone.
- Trade-offs: Large pools show fewer physical dice than before (15 vs 30); the exact total for the full pool is always in the modal and inline line, so correctness is unaffected.

### Decision 5: Preserve the instant / unsupported fallback and overlay-dismissal semantics unchanged

- Chosen: No behavioral change to WebGL probing, the persistent-vs-transient failure split, `disableAnimation` resolution, the body-level portal, or the capture-phase Escape / outside-click handling. The modal-gating logic explicitly short-circuits to "revealed" on the non-animated paths.
- Alternatives considered: Folding fallback detection into the overlay — rejected, duplicates logic already in `useDiceAnimation`.
- Rationale: These are load-bearing decisions (n047, reduced-motion default, persistent/transient failure split); this change is out of scope to revisit them.
- Trade-offs: None; this is a guardrail.

## Proposal to Design Mapping

- Proposal element: Dice ~500% larger, ≈ modal font size.
  - Design decision: Decision 1 (fixed `scale` + bounded container).
  - Validation approach: Unit test asserts `DiceBox` is constructed with a `scale` >= a threshold constant; manual visual check at desktop + mobile breakpoints recorded in tasks.
- Proposal element: Animation centered on screen.
  - Design decision: Decision 3 (centered vertical stack; bounded canvas).
  - Validation approach: `DiceRollOverlay` unit test asserts the canvas container is no longer `absolute inset-0` and is within a centered flex/stack layout; snapshot of class list.
- Proposal element: Dice land in the clear space just above the modal (both visible).
  - Design decision: Decision 3.
  - Validation approach: Unit test asserts DOM order (canvas precedes modal) and that both are rendered in the same centered container; visual check in tasks.
- Proposal element: Result modal hidden until the animation completes.
  - Design decision: Decision 2 (modal gating on completion signal).
  - Validation approach: Tests — modal absent while animation pending; appears after the `run()` promise resolves; appears immediately when `disableAnimation` or `status === 'unsupported'`.
- Proposal element: Safety timeout so the modal always appears.
  - Design decision: Decision 2 (fallback timeout `MODAL_REVEAL_FALLBACK_MS`).
  - Validation approach: Test with fake timers — completion signal never fires; modal appears after the fallback elapses.
- Proposal element: Cap animated subset at 15.
  - Design decision: Decision 4 (`DICE_ANIM_CAP = 15`).
  - Validation approach: `toDiceBoxNotation` test — `120d6` yields notation with 15 dice; modal/inline total is the full-pool total (asserted in `GlobalDiceFab` test).
- Proposal element: Scale down when more than 6 dice animate.
  - Design decision: Decision 4 (`diceAnimationScale(count)` pure curve).
  - Validation approach: Pure-function unit tests for counts 1, 6, 7, 10, 15 — monotonic non-increasing, `count <= 6` returns base, `count > 6` strictly less, floored.
- Proposal element: No new randomness / network / outcome change.
  - Design decision: Decision 5 + existing predetermined-notation path.
  - Validation approach: Existing tests for `toDiceBoxNotation` predetermined faces stay green; `GlobalDiceFab` test asserts `built.total` unchanged through the overlay.
- Proposal element: Preserve instant/unsupported fallback + dismissal semantics.
  - Design decision: Decision 5.
  - Validation approach: Existing `useDiceAnimation` and `DiceRollOverlay` tests stay green; added tests for immediate reveal on fallback paths and Escape-closes-overlay-only.

## Functional Requirements Mapping

- Requirement: Rolling plays a legible, centered dice animation, then reveals the total modal below the settled dice.
  - Design element: Decisions 1, 2, 3.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` — MODIFIED "Rolling plays a dice animation then a total modal", scenarios "Pool roll animates larger centered dice then reveals the modal", "Percentile roll animates two centered d10s then reveals the decoded value".
  - Testability notes: RTL render of `GlobalDiceFab`; mock `useDiceAnimation` to control the completion promise; assert modal presence transitions and canvas container layout classes.
- Requirement: The modal is not shown until the animation completes, is skipped, or a fallback timeout elapses.
  - Design element: Decision 2.
  - Acceptance criteria reference: spec scenarios "Modal stays hidden until the tumble settles", "Modal shows immediately when animation is disabled", "Modal shows immediately when the dice engine is unsupported", "Modal is revealed by the fallback timeout if completion never signals".
  - Testability notes: jest fake timers; a deferred promise for the completion signal; assert `queryByRole('dialog')` is null then non-null.
- Requirement: No more than 15 dice animate; the modal and inline result always show the exact total for the whole pool.
  - Design element: Decision 4.
  - Acceptance criteria reference: spec scenario "Large pools animate a capped subset of 15".
  - Testability notes: `toDiceBoxNotation` unit test counts dice tokens; `GlobalDiceFab` test asserts total text equals `built.total` for a 120-die pool.
- Requirement: When more than 6 dice animate, dice are scaled down progressively.
  - Design element: Decision 4 (`diceAnimationScale`).
  - Acceptance criteria reference: spec scenario "More than six dice shrink to fit the clear zone".
  - Testability notes: pure function tests; `useDiceAnimation` test asserts `DiceBox` receives the reduced `scale` for a >6 count.
- Requirement: The overlay is still dismissed by Escape / outside-click (overlay only), and a new roll yields exactly one overlay.
  - Design element: Decision 5.
  - Acceptance criteria reference: spec (unchanged) "Dismissing the roll overlay leaves the dice panel open"; regression-guarded here.
  - Testability notes: existing tests retained; add assertion that `modalRevealed` resets on a new `built` prop.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: The result modal MUST always become visible after a roll, regardless of animation/WebGL failure.
  - Design element: Decision 2 fallback timeout; Decision 5 unsupported short-circuit.
  - Acceptance criteria reference: spec scenario "Modal is revealed by the fallback timeout if completion never signals".
  - Testability notes: fake-timer test with a never-resolving completion promise; assert modal appears at `MODAL_REVEAL_FALLBACK_MS`.
- Requirement category: performance
  - Requirement: No additional network requests or main-thread work beyond the existing lazy dice-box import; the animated dice count is bounded at 15.
  - Design element: Decision 4 cap; unchanged lazy import in `useDiceAnimation`.
  - Acceptance criteria reference: see functional scenario "Large pools animate a capped subset of 15" (no separate NFAC scenario — cross-reference).
  - Testability notes: assert no `fetch` / XHR is triggered by the overlay in tests; assert notation dice count ceiling.
- Requirement category: operability / accessibility
  - Requirement: Non-visual users still receive immediate roll feedback even though the modal is delayed.
  - Design element: unchanged inline `formula → [rolls] = total` line in `GlobalDiceFab`.
  - Acceptance criteria reference: see functional scenario "Pool roll animates larger centered dice then reveals the modal" (inline line assertion) — cross-reference, no separate NFAC scenario.
  - Testability notes: `GlobalDiceFab` test asserts the inline result line is present before the modal appears.

## Risks / Trade-offs

- Risk/trade-off: Empirical `scale` / container tuning; size may vary by viewport.
  - Impact: Dice too large (clip clear zone) or still too small.
  - Mitigation: viewport-unit container sizing with a `max` cap; `scale` as a single tunable constant; down-scaling curve unit-tested; explicit desktop + mobile visual-check task.
- Risk/trade-off: Completion signal may never fire (context loss, backgrounded tab).
  - Impact: Modal never appears.
  - Mitigation: mandatory overlay fallback timeout independent of dice-box; on timeout reveal modal and tear down the box.
- Risk/trade-off: 15 large dice pile up / clip / rest on the modal edge.
  - Impact: Total obscured.
  - Mitigation: down-scaling curve sized for 15; canvas floor margin above the modal; validate `15d6` and `120d6` in tasks.
- Risk/trade-off: Delayed focus into the dialog for keyboard / screen-reader users.
  - Impact: brief focus limbo during the tumble.
  - Mitigation: inline panel result renders immediately; focus still moves to the modal when revealed.
- Risk/trade-off: Regression of instant/unsupported fallback or Escape-closes-overlay-only.
  - Impact: broken overlay for no-WebGL users; panel closes on Escape.
  - Mitigation: keep existing tests green; add explicit fallback-path and dismissal regression tests.

## Rollback / Mitigation

- Rollback trigger: Post-merge, the animation is visually broken (dice clip/obscure the modal) or the modal fails to appear for some users, and a forward fix is not immediate.
- Rollback steps: Revert the change's PR (single squash commit). The reverted state restores the prior overlay/animation behavior. Alternatively, users can tick "Disable animation" in the dice panel for an immediate personal workaround while a fix is prepared.
- Data migration considerations: None — no persisted data, schema, or API surface changes.
- Verification after rollback: `GlobalDiceFab` renders; rolling shows the result modal; existing `DiceRollOverlay` / `useDiceAnimation` / `GlobalDiceFab` unit suites pass on the reverted commit.

## Operational Blocking Policy

- If CI checks fail: treat as blocking. Diagnose from the failing job logs, fix on the working branch, re-run the project's unit/integration/build commands locally (per README / AGENTS.md), commit, push, and re-check. Do not merge with red required checks and never use `--admin`.
- If security / code-quality checks fail (Verity gate, Codacy): fix the finding — that is the default. Only `verity waive` a finding when a human has explicitly accepted that specific risk in this change's review, citing the source in `--reason`. Never waive on the agent's own judgement.
- If required reviews are blocked/stale: after opening the PR and passing the `pr-review-toolkit:review-pr` gate (zero findings), enable auto-merge (`gh pr merge --auto --merge`) and let GitHub merge when conditions are met. Poll review threads and CI autonomously; address each, push, repeat.
- Escalation path and timeout: if `pr-review-toolkit:review-pr` findings persist after three or more review-fix-push iterations with no progress, stop, report the remaining findings to the user, and wait for human guidance. Same for any CI failure that resists three fix attempts.

## Open Questions

- None. All open questions from the issue #596 explore session were resolved before this proposal (dice land top-left today; modal-gating is a missed original requirement; dice land just above the modal; cap 15, shrink beyond 6). If implementation surfaces that the "≈ modal font size" target is not achievable within the clear zone for the 15-die case, that is a scope change and per Change Control the proposal/design/specs/tasks are updated before continuing.
