## GitHub Issues

- dougis-org/session-combat#586
- Depends on: dougis-org/session-combat#585 (CLOSED — in-chat dice surface removed; `GlobalDiceFab` is now the sole dice surface)

## Why

- Problem statement: Rolling dice in `GlobalDiceFab` is instantaneous and text-only. The
  result appears as a single `formula → [rolls] = total` line with no sense of physical
  dice, no moment of anticipation, and no emphasis on the total. Sharing a roll to session
  chat is a separate manual button press after the roll.
- Why now: #585 removed the in-chat dice surface, so `GlobalDiceFab` is the only place dice
  are rolled. There is now a single, clean integration point for a richer roll experience
  instead of two surfaces to keep in sync.
- Business/user impact: A tactile 3D roll with a prominent total makes the core action of a
  tabletop app feel like the table. Folding "share to chat" into a persisted preference
  removes a step from the common case (playing in an active session).

## Problem Space

- Current behavior:
  - `handleRoll` / `handlePercentileRoll` call `dp.buildRoll()` / `dp.buildPercentileRoll()`
    and set `result` synchronously. The inline result line renders immediately.
  - `BuiltRoll` is `{ formula, rolls: number[], total }` — `useDicePoolState.buildRoll`
    calls `rollDicePool(groups).map(r => r.value)`, discarding the per-die `sides`;
    `buildPercentileRoll` keeps only the decoded `value`, discarding the two d10 faces.
  - Sharing is a manual "Send to session chat" button (`handleSendToChat`) shown after a
    roll when `presence` exists; `sendState` tracks idle/pending/sent/failed.
  - `useDicePoolState` owns outside-click / Escape close for the FAB panel via a
    document-level listener.
- Desired behavior:
  - On Roll (pool or percentile), the app plays a 3D dice animation of exactly the staged
    dice, each die coming to rest showing its already-decided face value, then shows a
    total modal layered above the FAB panel.
  - The animation and total modal persist until the user dismisses them (Escape or
    click/tap outside), closing only the overlay — the FAB panel stays open with the pool
    intact.
  - "Send to session chat" becomes a persisted checkbox in the FAB panel. When checked
    **and** an active session exists, the roll auto-submits on Roll; the animation starts
    only after the roll is persisted (HTTP 201). Otherwise the result is local only and
    nothing touches the network.
  - If persistence fails, the already-decided result still animates and the total modal
    still shows; a "not shared — retry" affordance appears (reuses today's failed-send
    text). Animation is never blocked by a failed POST.
  - A "Disable Animation" checkbox in the FAB panel skips the tumble; the total modal and
    inline result still render instantly. It defaults from `prefers-reduced-motion` until
    the user toggles it, after which the stored choice wins.
- Constraints:
  - No change to the `POST /api/campaigns/[id]/rolls` contract or the `BuiltRoll.rolls` /
    persisted payload shape (decision n121 — percentile persists a single d% value).
  - Roll outcomes are decided up front by the existing secure, rejection-sampled dice
    utilities (`rollDicePool`, `rollPercentile`); the animation only visually settles on
    faces already chosen. No new randomness path (decisions n116, n121).
  - Animate only after a shared roll is persisted (decisions n124, n126).
  - Reduced-motion is the default; an explicit stored preference overrides it (decision n125).
  - Next.js App Router: any 3D/WebGL library must be client-only and must not block the
    initial bundle or first paint of the app.
  - Dice visuals should route through shared dice components where practical (decision n123).
- Assumptions:
  - A maintained 3D dice library exists that supports **predetermined** outcomes (faces
    decided by the caller, physics settles to them) for d4/d6/d8/d10/d12/d20 and percentile
    (d100 as two d10s). `@3d-dice/dice-box` is the leading candidate (`Box.roll("2d20@14,19")`
    notation); final selection is a design decision.
  - The library's runtime assets (physics WASM, 3D models, textures) can be self-hosted
    under `public/` and loaded lazily on first roll.
  - Staged pool is already bounded (`MAX_PER_DIE = 20` per size, 6 sizes → 120 dice max);
    a lower visual cap for the animation is acceptable UX.
- Edge cases considered:
  - Roll fired while a previous overlay is still open (rapid re-roll).
  - Roll with no active session but "send to chat" checked → treat as local-only.
  - `prefers-reduced-motion` changes at runtime after the user has set an explicit choice
    (explicit choice must continue to win).
  - Library assets fail to load / WebGL unavailable → must degrade to the instant path,
    not a broken overlay.
  - Very large pools (e.g. 120 d6) — visual cap and/or performance fallback.
  - Percentile: two physical d10 faces animate; persisted/inline value stays the single
    decoded 1–100.
  - Overlay Escape vs. the FAB panel's own Escape handler (both on `document`).
  - Storage unavailable (private mode) for the two persisted checkboxes.

## Scope

### In Scope

- Extend `BuiltRoll` (and `buildRoll` / `buildPercentileRoll` in `lib/dice/useDicePoolState.ts`)
  to additively carry the per-die breakdown (`{ sides, value }[]`), the applied modifier, and
  the two percentile faces. No change to `formula` / `rolls` / `total`.
- Select and integrate a client-only 3D dice animation library with predetermined outcomes.
- New overlay component: body-level portal (decision n047) rendering the dice canvas and a
  total modal, dismissible by Escape / outside click, closing only itself.
- Replace the "Send to session chat" button with a persisted "send to session chat"
  checkbox in the FAB panel; auto-submit on Roll when checked + active session.
- New persisted "Disable Animation" checkbox with `prefers-reduced-motion` default and
  stored-choice override.
- Re-order `handleRoll` / `handlePercentileRoll`: build → (maybe persist) → animate → total
  modal, per decisions n124 / n126.
- Retry affordance on persistence failure (reuse existing failed-send copy).
- Lazy-load the animation library + assets only when a roll first needs them and animation
  is enabled.
- Graceful degradation to the instant path when WebGL / assets are unavailable.
- Tests per the feedback-loop schema (see `tests.md`).

### Out of Scope

- Any change to `POST /api/campaigns/[id]/rolls`, the SSE roll-ingestion path, or the
  persisted roll payload (decisions n113–n117, n121).
- Animating rolls that arrive from other players via SSE in the chat dock.
- Dice themes / skins / customization, sound effects, haptics.
- Re-introducing dice UI into the chat dock (reverses #585).
- Changing pool bounds, modifier handling, or visibility scopes.
- Server-side rendering of dice.

## What Changes

- `lib/dice/useDicePoolState.ts`: `BuiltRoll` gains `breakdown: { sides: number; value: number }[]`,
  `modifier: number`, and `percentileFaces?: [number, number]`; `buildRoll` /
  `buildPercentileRoll` populate them without dropping existing fields.
- `lib/components/GlobalDiceFab.tsx`: `handleRoll` / `handlePercentileRoll` become async
  and follow build → maybe-persist → animate → modal; the "Send to session chat" button is
  replaced by a checkbox; a "Disable Animation" checkbox is added; the inline result line
  and retry affordance remain.
- New: a dice-roll overlay component + a small hook for the animation library lifecycle
  (lazy init, run predetermined roll, teardown) and a hook for the two persisted checkboxes
  (following the `useDockState` `LocalStore` + `safeGet`/`safeSet` pattern).
- New: `package.json` dependency for the chosen 3D dice library; self-hosted library assets
  under `public/`.
- New capability spec delta(s) under `openspec/changes/add-dice-roll-animation/specs/`
  for the `global-dice-fab` capability (and `dice-pool-shared-state` for the data seam).
- `next.config` / CSP and Jest config adjustments if required by the library assets.

## Risks

- Risk: 3D dice library increases bundle size / adds WASM + model assets.
  - Impact: Slower first roll; larger deploy; possible CSP friction with WASM.
  - Mitigation: Client-only dynamic import; load assets only on first animated roll;
    self-host assets; measure and cap; instant path always available as fallback.
- Risk: Chosen library does not cleanly support predetermined outcomes for every die type
  (notably percentile / d10 "00").
  - Impact: Animation could settle on a face that disagrees with the persisted value.
  - Mitigation: Spike the predetermined API for d4–d20 and percentile before committing in
    design; if unsupported, fall back to a 2D SVG tumble for the affected die types.
- Risk: WebGL unavailable (older devices, headless, some VMs) or asset load failure.
  - Impact: Broken or empty overlay.
  - Mitigation: Feature-detect WebGL and asset load; on failure use the instant path and
    still show the total modal + inline result.
- Risk: Two `document`-level Escape handlers (overlay vs. FAB panel) race.
  - Impact: Dismissing the overlay also closes the FAB panel, losing the staged pool.
  - Mitigation: Overlay handler runs first (capture phase or `stopPropagation`);
    spec scenario asserts the panel stays open.
- Risk: Async `handleRoll` introduces a window where a second Roll click double-submits or
  stacks overlays.
  - Impact: Duplicate chat entries or overlapping canvases.
  - Mitigation: Disable Roll / percentile controls while a roll is in flight (today's
    `sendState === 'pending'` already disables them); single-overlay invariant in the hook.
- Risk: Persisting an extra field on `BuiltRoll` leaks into the roll submission payload.
  - Impact: Contract drift.
  - Mitigation: `submitRoll` continues to receive only `formula, rolls, total, visibility`;
    spec scenario asserts the POST body is unchanged.
- Risk: Test environment (jsdom) cannot run WebGL.
  - Impact: Component tests can't exercise the real animation.
  - Mitigation: Mock the animation hook at its seam; assert ordering and the instant path;
    keep predetermined-outcome logic in a pure, unit-testable function.

## Open Questions

- Question: Confirm `@3d-dice/dice-box` as the library, or is another maintained 3D dice
  roller preferred (e.g. a Three.js-native option)?
  - Needed from: requester (dougis)
  - Blocker for apply: no — design will recommend `@3d-dice/dice-box` with a documented
    fallback; a different pick only swaps the integration hook.
- Question: Visual cap on animated dice — settle on a number (e.g. 30) above which the
  animation shows a representative subset while the total stays exact?
  - Needed from: requester (dougis)
  - Blocker for apply: no — design will propose a default; adjustable later.
- Question: Should the total modal also show the per-die breakdown and modifier, or just
  the total (with the inline line carrying the breakdown)?
  - Needed from: requester (dougis)
  - Blocker for apply: no — design will propose total-only in the modal, breakdown inline.

All other ambiguity from the #586 explore session was resolved in the issue's Decisions
block (2026-08-29) and the associated Verity decisions n123–n126; the three questions above
are refinements, none blocking apply.

## Non-Goals

- A configurable / themeable dice roller.
- Sound, haptics, or camera controls.
- Animating remote players' rolls in the chat dock.
- Any change to roll fairness, randomness, bounds, or the persistence/SSE contract.
- A generic animation framework for the rest of the app.

## Change Control

If scope changes after proposal approval, update
`openspec/changes/add-dice-roll-animation/proposal.md`,
`openspec/changes/add-dice-roll-animation/design.md`,
`openspec/changes/add-dice-roll-animation/specs/**/*.md`, and
`openspec/changes/add-dice-roll-animation/tasks.md` before implementation starts.
