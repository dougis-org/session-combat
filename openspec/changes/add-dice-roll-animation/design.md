## Context

- Relevant architecture:
  - `lib/components/GlobalDiceFab.tsx` — the sole dice surface after #585. Owns `result`
    (`BuiltRoll | null`), `sendState`, `presence` (from `onPresenceChange`), and renders the
    FAB trigger + a modal panel of die-pool controls, a modifier input, a Roll button, the
    `PercentileButton`, and an inline result line with a "Send to session chat" button.
  - `lib/dice/useDicePoolState.ts` — hook owning the staged pool, modifier, visibility, and
    `buildRoll()` / `buildPercentileRoll()` which return `BuiltRoll = { formula, rolls, total }`.
    Also owns the FAB panel's document-level outside-click / Escape close.
  - `lib/utils/dice.ts` — `rollDicePool(groups) → { sides, value }[]` and
    `rollPercentile() → { tensFace, onesFace, value }`, both cryptographically secure with
    rejection sampling. These already produce the per-die detail the current `BuiltRoll` drops.
  - `lib/dice/useRollSubmission.ts` — `submitRoll(formula, rolls, total, visibility)`,
    POSTs `/api/campaigns/[id]/rolls`, returns `'success' | 'conflict' | 'error'` (201 / 409 / other).
  - `lib/components/dice/DieGlyph.tsx` — shared icon+label pairing (decision n123).
  - `lib/components/Modal.tsx` — existing modal primitive (Escape + overlay-click close,
    body-scroll lock). Not a portal today; renders inline.
  - Persistence pattern: `lib/components/CampaignChat/useDockState.ts` uses `LocalStore`
    with `safeGet` / `safeSet` / `safeRemove` wrappers and named non-secret keys
    (`// nosemgrep`).
  - `jest.config.js` already excludes nested worktrees anchored to `<rootDir>` (decisions
    n118–n120).
- Dependencies:
  - New runtime dependency: a client-only 3D dice library with predetermined outcomes
    (`@3d-dice/dice-box` proposed).
  - Self-hosted library assets (physics WASM + models + textures) under `public/`.
  - No new server dependencies.
- Interfaces/contracts touched:
  - `BuiltRoll` (additive fields only).
  - `GlobalDiceFab` internal handlers become async.
  - `POST /api/campaigns/[id]/rolls` — **unchanged**; `submitRoll` still receives only
    `formula, rolls, total, visibility`.
  - No change to the SSE roll-ingestion path or persisted roll payload (decisions n113–n117, n121).

## Goals / Non-Goals

### Goals

- A 3D dice tumble of exactly the staged dice, each settling on its already-decided face.
- A total modal layered above the FAB panel, persisting until Escape / outside-click, which
  closes only the overlay and leaves the FAB panel + pool intact.
- Roll outcomes decided up front by the existing secure utilities; animation is cosmetic.
- Shared rolls persist before the animation starts; a failed POST never blocks animation or
  the total modal (decisions n124, n126).
- "Send to session chat" as a persisted checkbox; auto-submit on Roll when checked + active
  session.
- "Disable Animation" checkbox defaulting from `prefers-reduced-motion`, overridden by an
  explicit stored choice (decision n125).
- Graceful, automatic degradation to the instant path when WebGL / assets are unavailable.
- The 3D library and its assets never enter the initial bundle or first paint.

### Non-Goals

- Dice themes/skins, sound, haptics, camera controls.
- Animating remote (SSE) rolls in the chat dock.
- Any change to roll fairness, bounds, modifier logic, visibility scopes, or the
  persistence / SSE contract.
- A general-purpose animation framework for the rest of the app.

## Decisions

### Decision 1: Additive data seam on `BuiltRoll`

- Chosen: Extend `BuiltRoll` to
  `{ formula, rolls: number[], total, breakdown: { sides: number; value: number }[], modifier: number, percentileFaces?: [number, number] }`.
  `buildRoll` keeps `rollDicePool(groups)` results intact for `breakdown` and still derives
  `rolls`/`total` as today. `buildPercentileRoll` sets `percentileFaces: [tensFace, onesFace]`
  and keeps `rolls: [value]`, `total: value`.
- Alternatives considered: (a) a parallel return value / second hook method — more surface,
  two code paths to keep in sync; (b) recomputing the breakdown in the component from
  `rolls` — impossible for mixed pools (which value came from which die size is lost).
- Rationale: The utilities already compute this; the only change is to stop discarding it.
  Purely additive — existing consumers and the POST body are untouched.
- Trade-offs: `BuiltRoll` grows; any code constructing `BuiltRoll` literals in tests must add
  the fields (small, mechanical).

### Decision 2: 3D dice library — `@3d-dice/dice-box`, client-only, lazy, with fallback

- Chosen: `@3d-dice/dice-box` (Babylon-based, ammo/rapier physics, maintained, supports
  **predetermined** results via `"Ndf@v1,v2,…"` notation and percentile as `d100`/`d10`).
  Loaded via `next/dynamic` (or a dynamic `import()` inside the animation hook) so it is
  client-only and excluded from the initial bundle. Library assets self-hosted under
  `public/dice-box/` and fetched on first animated roll. A pure `toDiceBoxNotation(BuiltRoll)`
  function maps the breakdown to predetermined notation and is unit-tested without WebGL.
- Alternatives considered:
  - `@3d-dice/dice-box-threejs` — Three.js-native, but thinner maintenance and a different
    predetermined API; keep as the documented drop-in alternative if the requester prefers
    a Three.js stack.
  - Hand-rolled CSS 3D / 2D SVG tumble — no dependency, but months of dice-shape and physics
    polish to look right; retained only as the **degradation target**, not the primary path.
  - `three` + custom physics — largest surface, out of proportion to the feature.
- Rationale: Predetermined outcomes are the hard requirement (faces are already decided by
  `rollDicePool` / `rollPercentile`); `dice-box` supports them directly for d4/d6/d8/d10/d12/d20
  and percentile. Self-hosting assets keeps CSP simple and avoids a third-party origin.
- Trade-offs: Adds WASM + model assets (~hundreds of KB, lazy); Babylon runtime rather than
  the app's (nonexistent) incumbent 3D stack; jsdom cannot run it, so component tests mock
  the hook seam.

### Decision 3: Roll flow re-ordering

- Chosen: `handleRoll` / `handlePercentileRoll` become async and follow:
  1. `built = dp.buildRoll()` / `dp.buildPercentileRoll()` (outcome decided now).
  2. If `sendToChat` checked **and** `presence?.sessionId` present:
     `setSendState('pending')`; `outcome = await submitRoll(built.formula, built.rolls, built.total, dp.visibility)`;
     `setSendState(outcome === 'success' ? 'sent' : 'failed')`.
     - On `'success'` (201): proceed to animate.
     - On `'conflict'`/`'error'`: still proceed to animate; the inline retry affordance shows.
  3. Else (unchecked or no session): no network call; proceed straight to animate.
  4. Animate: if animation enabled and WebGL/assets OK → run the predetermined tumble in the
     overlay, then reveal the total modal on settle. If disabled or unavailable → open the
     overlay with the total modal immediately (no tumble).
  5. `setResult(built)` so the inline line renders (as today).
- Alternatives considered: animate first, then persist (violates decisions n124/n126 — the
  animated UI would imply a successful share before it is one); block animation on POST
  failure (hides feedback for an already-decided local result — violates n126).
- Rationale: Matches decisions n124 (animate only after persisted) and n126 (failed
  persistence still renders the local result).
- Trade-offs: A brief "Sending…" gap before the tumble when sharing; Roll/percentile
  controls must be disabled while in flight (today's `sendState === 'pending'` disable
  already does this) to prevent double-submit / stacked overlays.

### Decision 4: Overlay + total modal as a body-level portal

- Chosen: New `DiceRollOverlay` component rendered through a lazily created
  `document.body` overlay root (decision n047), above the FAB panel's `z-50`. It hosts the
  dice-box canvas container and the total modal. Its own Escape / outside-click handler
  registers on `document` in the **capture phase** (or calls `stopPropagation`) so it fires
  before `useDicePoolState`'s panel handler; dismissing the overlay closes only the overlay.
  A single-overlay invariant: a new roll while one is open tears down and replaces it.
- Alternatives considered: reuse `Modal.tsx` (renders inline, would be clipped by the FAB's
  fixed container and cannot host a full-viewport canvas cleanly); render inside the FAB
  panel (clipping + stacking issues, n047).
- Rationale: n047 already mandates body-level portals for floating dice UI; a WebGL canvas
  especially must escape the panel's `overflow`/stacking context.
- Trade-offs: A second document-level key handler to coordinate with the existing one;
  portal root lifecycle to manage (create lazily, safe under SSR).

### Decision 5: Two persisted checkboxes via a `LocalStore` hook

- Chosen: `useDiceFabPreferences()` hook following the `useDockState` pattern:
  - `sendToChat`: boolean, key `dice-fab-send-to-chat` (`// nosemgrep`), default `false`.
    Persisted on every toggle.
  - `disableAnimation`: tri-state stored value `true | false | null` (absent), key
    `dice-fab-disable-animation` (`// nosemgrep`). Resolved value:
    `stored === null ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : stored`.
    First user toggle writes an explicit boolean, which wins from then on even if the media
    query changes.
  - All reads/writes go through `safeGet` / `safeSet` (storage unavailable → in-memory only,
    no throw).
- Alternatives considered: a boolean for `disableAnimation` (cannot distinguish "never
  chosen" from "chose false", so reduced-motion default couldn't apply); a React context
  (overkill for one component).
- Rationale: Matches decision n125 and the established persistence pattern.
- Trade-offs: Tri-state needs a small `isValidStored` guard; a `matchMedia` read on mount
  (client-only — guarded).

### Decision 6: Visual cap and percentile rendering

- Chosen: Animate up to `DICE_ANIM_CAP = 30` dice; above that, animate a 30-die
  representative subset while the total modal and inline line stay exact and mention the
  full count. Percentile animates two physical d10s; the total modal and inline value show
  the single decoded 1–100 (decision n121).
- Alternatives considered: no cap (120 d6 tanks frame rate on weak GPUs); animate all but
  shrink (unreadable).
- Rationale: Keeps the animation legible and performant; the number that matters (total) is
  never approximated.
- Trade-offs: A large pool's tumble is illustrative, not literal — acceptable and noted in
  the spec scenario.

### Decision 7: Degradation path

- Chosen: Before the first animated roll, feature-detect WebGL and attempt the asset load
  behind a timeout. On failure (WebGL unavailable, asset fetch fails/times out, dice-box
  `init()` throws), permanently fall back for the session to the instant path: open the
  overlay with the total modal, no tumble. Logged once via the existing client logging seam.
- Alternatives considered: retry per roll (repeated stalls); show an error overlay (worse
  than just showing the result).
- Rationale: The result is always available; the animation is an enhancement.
- Trade-offs: Users on unsupported setups silently get the instant experience (intended).

## Proposal to Design Mapping

- Proposal element: Extend `BuiltRoll` / `buildRoll` / `buildPercentileRoll` additively.
  - Design decision: Decision 1.
  - Validation approach: Unit tests on `useDicePoolState` asserting `breakdown`, `modifier`,
    `percentileFaces` populated and `formula`/`rolls`/`total` unchanged; type-level check
    that `submitRoll` args are unchanged.
- Proposal element: Client-only 3D dice library with predetermined outcomes.
  - Design decision: Decision 2.
  - Validation approach: Unit test `toDiceBoxNotation` for every die type + percentile +
    modifier + mixed pool; bundle-size check that the library is not in the initial chunk;
    manual/e2e smoke that a real roll settles on the decided faces.
- Proposal element: Overlay + total modal, dismiss closes only the overlay.
  - Design decision: Decision 4.
  - Validation approach: Component test — open overlay, press Escape, assert overlay gone
    and FAB panel still open with pool intact; outside-click same; portal mounts to
    `document.body`.
- Proposal element: "Send to session chat" persisted checkbox, auto-submit on Roll.
  - Design decision: Decisions 3, 5.
  - Validation approach: Component tests — checked + session → `submitRoll` called once with
    exact args, animation starts only after resolve; unchecked or no session → no
    `submitRoll` call; checkbox value persists across remount.
- Proposal element: Animate only after persistence; failure still animates + shows retry.
  - Design decision: Decision 3.
  - Validation approach: Component tests — mock `submitRoll` success → animate hook invoked
    after resolve; mock `error`/`conflict` → animate hook still invoked, retry affordance
    rendered, no exception.
- Proposal element: "Disable Animation" checkbox, reduced-motion default, stored override.
  - Design decision: Decision 5.
  - Validation approach: Unit tests on `useDiceFabPreferences` — no stored value + RM on →
    resolved `true`; no stored value + RM off → `false`; explicit `false` + RM on →
    `false`; persists across remount.
- Proposal element: Lazy-load library + assets; degrade when WebGL/assets unavailable.
  - Design decision: Decisions 2, 7.
  - Validation approach: Component test — animate hook reports unsupported → overlay opens
    with total modal, no canvas; dynamic import not evaluated when animation disabled.
- Proposal element: Visual cap; percentile shows two d10s but one value.
  - Design decision: Decision 6.
  - Validation approach: Unit test `toDiceBoxNotation` caps at 30; percentile notation is
    two d10s; total modal value equals decoded percentile value.

## Functional Requirements Mapping

- Requirement: Rolling (pool or percentile) plays a dice animation of the staged dice
  settling on their decided values, then shows a total modal.
  - Design element: Decisions 2, 3, 4, 6.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` — "Rolling plays an
    animation then a total modal".
  - Testability notes: Animation hook mocked at its seam in component tests; ordering and
    props asserted; real WebGL exercised only in e2e/manual smoke.
- Requirement: The overlay/modal persist until Escape or outside-click, and dismissal closes
  only the overlay (FAB panel + pool remain).
  - Design element: Decision 4.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` — "Dismissing the roll
    overlay leaves the dice panel open".
  - Testability notes: jsdom key + pointer events; assert portal node removed and panel
    query still present.
- Requirement: When "send to session chat" is checked and a session is active, the roll is
  submitted once and the animation starts only after a 201.
  - Design element: Decisions 3, 5.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` — "Checked send-to-chat
    persists the roll before animating".
  - Testability notes: Mock `useRollSubmission`; assert call count/args and that the animate
    seam is not called before the promise resolves.
- Requirement: When unchecked or no active session, no network request is made and the
  animation plays immediately.
  - Design element: Decision 3.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` — "Local rolls never
    touch the network".
  - Testability notes: Assert `fetch` / `submitRoll` not called.
- Requirement: A failed persistence still animates and shows the total, plus a retry
  affordance.
  - Design element: Decisions 3, 7.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` — "Failed share still
    animates the local result".
  - Testability notes: Mock `submitRoll` → `'error'`; assert animate seam called, retry
    button rendered, no throw.
- Requirement: "Disable Animation" defaults from `prefers-reduced-motion` and is overridden
  by an explicit stored choice.
  - Design element: Decision 5.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` — "Animation preference
    follows reduced-motion until explicitly set".
  - Testability notes: Mock `matchMedia` and `LocalStore`; table of (stored, RM) → resolved.
- Requirement: `buildRoll` / `buildPercentileRoll` expose the per-die breakdown, modifier,
  and percentile faces without changing `formula` / `rolls` / `total` or the POST body.
  - Design element: Decision 1.
  - Acceptance criteria reference: `specs/dice-pool-shared-state/spec.md` — "Built rolls
    carry a per-die breakdown".
  - Testability notes: Unit test on the hook; assert `submitRoll` still receives four args.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: The 3D library and its assets must not be in the initial bundle or block
    first paint; assets load only on the first animated roll.
  - Design element: Decisions 2, 7.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` NFAC Performance — "Dice
    animation code is not in the initial bundle".
  - Testability notes: Build-output inspection / bundle-analyzer assertion that the library
    package name is absent from the entry chunk; test that the dynamic import is not
    evaluated when animation is disabled.
- Requirement category: performance
  - Requirement: No more than `DICE_ANIM_CAP` (30) dice are animated regardless of pool size.
  - Design element: Decision 6.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` NFAC Performance — "Large
    pools animate a capped subset".
  - Testability notes: Unit test `toDiceBoxNotation` with a 120-die pool → ≤30 dice in
    notation; total unchanged.
- Requirement category: reliability
  - Requirement: WebGL unavailable or asset load failure degrades to the instant path; the
    total and inline result are always shown.
  - Design element: Decision 7.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` NFAC Reliability — "Roll
    result survives an animation failure". Cross-references functional scenario "Failed
    share still animates the local result" for the persistence-failure case.
  - Testability notes: Mock the animation hook to report `unsupported`; assert overlay opens
    with total modal and no canvas node.
- Requirement category: security
  - Requirement: Library assets are self-hosted (same origin); no new third-party origin,
    no change to the roll API contract or payload.
  - Design element: Decisions 2, 3.
  - Acceptance criteria reference: See functional scenario `specs/dice-pool-shared-state/spec.md`
    — "Built rolls carry a per-die breakdown" (asserts POST body unchanged) and
    `specs/global-dice-fab/spec.md` — "Checked send-to-chat persists the roll before
    animating" (asserts exact `submitRoll` args). No separate NFAC scenario.
  - Testability notes: Covered by the referenced functional scenarios; asset path is a
    `public/` relative URL checked in review.
- Requirement category: operability
  - Requirement: Animation failures are logged once via the existing client logging seam,
    not surfaced as user-facing errors.
  - Design element: Decision 7.
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` NFAC Operability —
    "Animation failure is logged once and not shown to the user".
  - Testability notes: Spy on the logging seam; assert single call and no error UI.

## Risks / Trade-offs

- Risk/trade-off: `@3d-dice/dice-box` predetermined API may not cover percentile "00"/d10
  edge decoding exactly.
  - Impact: Animated faces could disagree with the persisted decoded value.
  - Mitigation: Design-time spike of the predetermined API for d4–d20 + percentile before
    the dependency is committed in `tasks.md`; if percentile is unsupported, animate its two
    d10s via the 2D SVG fallback while pool dice use dice-box. `toDiceBoxNotation` is pure
    and unit-tested against the decoded value.
- Risk/trade-off: Babylon/WASM runtime size.
  - Impact: Larger deploy; first animated roll has a load delay.
  - Mitigation: Dynamic import; self-hosted lazy assets; measured in CI; instant path always
    available.
- Risk/trade-off: Two `document`-level Escape handlers.
  - Impact: Overlay dismissal could also close the FAB panel.
  - Mitigation: Capture-phase / `stopPropagation` ordering; explicit spec scenario.
- Risk/trade-off: Async `handleRoll` opens a double-submit / stacked-overlay window.
  - Impact: Duplicate chat entries or overlapping canvases.
  - Mitigation: Disable Roll + percentile while `sendState === 'pending'` (existing);
    single-overlay invariant in the overlay hook.
- Risk/trade-off: jsdom cannot execute WebGL.
  - Impact: The real animation is untested in unit/component suites.
  - Mitigation: Mock at the animation-hook seam; keep notation mapping pure; cover the real
    path with an e2e/manual smoke listed in `tests.md`.
- Risk/trade-off: `BuiltRoll` literal construction in existing tests.
  - Impact: Compile breaks in test files.
  - Mitigation: Additive optional-friendly shape where possible; update literals as a
    mechanical task step.

## Rollback / Mitigation

- Rollback trigger: Animation causes crashes, unacceptable performance, or asset/CSP issues
  in production; or the library proves unable to honor predetermined outcomes.
- Rollback steps:
  1. Revert the PR (single squash merge) — restores the instant text-only roll and the
     "Send to session chat" button.
  2. If only the animation is problematic but the checkboxes/data-seam are fine, ship a
     follow-up that forces `disableAnimation` resolved-`true` and removes the dynamic import
     (keeps the persisted send-to-chat checkbox and `BuiltRoll` fields).
  3. Remove `public/dice-box/` assets and the `package.json` dependency.
- Data migration considerations: None server-side. Client localStorage keys
  `dice-fab-send-to-chat` / `dice-fab-disable-animation` are orphaned harmlessly on
  rollback; no cleanup required.
- Verification after rollback: Roll a pool and a percentile in an active session and
  confirm the roll persists and appears in chat via SSE; confirm no console errors and no
  dice-box network requests.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the working branch. Bundle-size / build failures block
  merge — do not merge with the library in the entry chunk. Flaky WebGL-adjacent tests must
  be made deterministic (mock the seam), not retried.
- If security checks fail: Address findings; do not `verity waive` on agent judgment
  (per project CLAUDE.md). A waive is only for a human-accepted risk citing a named source.
  New third-party origins are disallowed by Decision 2 — resolve by self-hosting.
- If required reviews are blocked/stale: Follow the schema's PR-and-Merge flow — run
  `pr-review-toolkit:review-pr`, address findings, iterate until zero findings, then enable
  auto-merge. If findings persist after 3 review-fix-push cycles with no progress, stop and
  report the remaining findings to the requester for guidance.
- Escalation path and timeout: If the design-time predetermined-outcome spike fails for a
  die type, or the requester's library preference differs, pause and raise it in the PR /
  with the requester before writing integration code. No fixed clock; blocked work is
  reported rather than worked around.

## Open Questions

- Confirm `@3d-dice/dice-box` vs. a Three.js-native roller (`@3d-dice/dice-box-threejs`).
  Non-blocking: default is `@3d-dice/dice-box`; swapping only changes the animation hook.
- `DICE_ANIM_CAP` value — 30 proposed. Non-blocking.
- Total modal content — total only (proposed), with the breakdown on the inline line.
  Non-blocking.
- All #586 explore-session questions and Verity decisions n123–n126 are resolved; the above
  are refinements, none blocking apply.
