# Tests

## Overview

Tests for the `add-dice-roll-animation` change. Strict TDD: write the failing test, make it
pass with the simplest code, refactor. Run tests through the project harness, never Jest
directly (decision n102). Component/unit tests mock the WebGL animation at its seam
(`useDiceAnimation`); the real animation is covered only by the E2E smoke.

Each case maps to a task in `tasks.md` and a scenario in `specs/**`.

## Test Cases

### E1 — Data seam on `BuiltRoll` (`tests/unit/lib/dice/useDicePoolState.test.ts`)

- [ ] `buildRoll()` returns `breakdown` with one `{sides,value}` per staged die, sizes
  matching the pool (`2d20+1d6` → two `sides:20`, one `sides:6`)
  → task E1 · spec `dice-pool-shared-state` "Built rolls carry a per-die breakdown…"
- [ ] `buildRoll()` breakdown values plus `modifier` sum to `total`; `modifier` field equals
  the clamped applied modifier
  → task E1 · spec `dice-pool-shared-state` "Built rolls carry a per-die breakdown…"
- [ ] `buildRoll()` `formula` / `rolls` / `total` are byte-identical to the pre-change output
  for the same pool + seeded RNG
  → task E1 · spec `dice-pool-shared-state` "Both consumers observe identical … behavior"
- [ ] `buildRoll()` issues no HTTP request
  → task E1 · spec `dice-pool-shared-state` "buildRoll still produces no network request"
- [ ] `buildPercentileRoll()` returns `percentileFaces: [tens, ones]`, each 1..10, decoding
  (tens%10*10 + ones%10, 0→100) to `total`; `rolls` stays `[value]`
  → task E1 · spec `dice-pool-shared-state` "Built percentile rolls carry the two physical d10 faces"
- [ ] `buildPercentileRoll()` does not read the staged pool or modifier and issues no request
  → task E1 · spec `dice-pool-shared-state` "Built percentile rolls carry the two physical d10 faces"

### E1 — POST body shape (`tests/unit/components/GlobalDiceFab.test.tsx`)

- [ ] When a roll is submitted, the `POST /api/campaigns/:id/rolls` body is exactly
  `{formula, rolls, total, visibility}` — no `breakdown` / `modifier` / `percentileFaces`
  → task E1 · spec `global-dice-fab` MODIFIED "Send to session chat…" / `dice-pool-shared-state` security NFAC

### E2 — Preferences hook (`tests/unit/lib/dice/useDiceFabPreferences.test.ts`)

- [ ] No stored `disableAnimation` + `matchMedia` reduced-motion `true` → resolved `true`
  → task E2 · spec `global-dice-fab` "No stored choice, reduced motion requested"
- [ ] No stored `disableAnimation` + reduced-motion `false` → resolved `false`
  → task E2 · spec `global-dice-fab` "No stored choice, reduced motion not requested"
- [ ] Stored explicit `false` + reduced-motion `true` → resolved `false` (explicit wins)
  → task E2 · spec `global-dice-fab` "Explicit choice overrides the media query"
- [ ] First toggle writes an explicit boolean to `localStorage`; subsequent media-query
  change does not alter the resolved value
  → task E2 · spec `global-dice-fab` "Explicit choice overrides the media query"
- [ ] `disableAnimation` and `sendToChat` both survive unmount/remount
  → task E2 · spec `global-dice-fab` "Preference persists across remount" / MODIFIED "…checkbox state persists across remount"
- [ ] `sendToChat` defaults to `false` with no stored value
  → task E2 · spec `global-dice-fab` MODIFIED "Send to session chat…"
- [ ] `LocalStore` throwing (storage unavailable) → hook returns defaults, no exception
  → task E2 · spec `global-dice-fab` "Animation preference follows reduced-motion…" (final SHALL)

### E3 — Notation mapping (`tests/unit/lib/dice/toDiceBoxNotation.test.ts`)

- [ ] Each die type d4/d6/d8/d10/d12/d20 maps to predetermined notation with the exact
  breakdown values
  → task E3 · spec `global-dice-fab` "Roll outcome is decided before the animation starts"
- [ ] Mixed pool `2d20+1d6` + modifier → notation covers all three dice; modifier does not
  become a die
  → task E3 · spec `global-dice-fab` "Pool roll animates the staged dice and shows the total"
- [ ] Percentile → notation for two d10 faces from `percentileFaces`
  → task E3 · spec `global-dice-fab` "Percentile roll animates two d10s and shows the decoded value"
- [ ] Pool of 120 dice → notation contains ≤ `DICE_ANIM_CAP` (30) dice; caller's `total`
  is untouched
  → task E3 · spec `global-dice-fab` NFAC Performance "Large pools animate a capped subset"

### E3 — Animation seam (`tests/unit/lib/dice/useDiceAnimation.test.ts`)

- [ ] WebGL/feature detection reports unsupported → `run()` resolves immediately, `status`
  is `'unsupported'`, logging seam called exactly once
  → task E3 · spec `global-dice-fab` NFAC Reliability "Roll result survives an animation failure" + NFAC Operability
- [ ] Asset load rejects / times out → same as above (instant resolve, single log)
  → task E3 · spec `global-dice-fab` NFAC Reliability
- [ ] The 3D library module is imported via dynamic `import()` and is not evaluated when
  `run()` is never called / animation disabled
  → task E3 · spec `global-dice-fab` NFAC Performance "Dice animation code is not in the initial bundle"
- [ ] A second `run()` while one is active tears down the first (single-instance invariant)
  → task E4 · spec `global-dice-fab` "A new roll replaces an open overlay"

### E3 — Bundle check (build-output assertion / CI)

- [ ] `next build` entry / first-load chunk does not contain `@3d-dice/dice-box`
  → task E3 · spec `global-dice-fab` NFAC Performance "Dice animation code is not in the initial bundle"

### E4 — Roll overlay (`tests/unit/components/DiceRollOverlay.test.tsx`)

- [ ] Overlay renders into a `document.body` child node, not inside the FAB panel subtree
  → task E4 · spec `global-dice-fab` "Rolling plays a dice animation then a total modal" (portal SHALL)
- [ ] Total modal displays `built.total`
  → task E4 · spec `global-dice-fab` "Pool roll animates the staged dice and shows the total"
- [ ] Escape once → overlay + modal removed; a sibling stub of the dice panel remains
  mounted (handler `stopPropagation`s so the panel's own Escape does not fire)
  → task E4 · spec `global-dice-fab` "Escape closes only the overlay"
- [ ] Click outside the modal content → overlay removed; panel stub remains
  → task E4 · spec `global-dice-fab` "Outside click closes only the overlay"
- [ ] `disableAnimation` resolved `true` → modal shown, no canvas/container node rendered
  → task E4 · spec `global-dice-fab` "Animation is skipped when animation is disabled"

### E5 — `GlobalDiceFab` wiring (`tests/unit/components/GlobalDiceFab.test.tsx`)

- [ ] "send to session chat" checkbox hidden when presence is null
  → task E5 · spec `global-dice-fab` MODIFIED "…Option hidden with no presence"
- [ ] Checkbox checked + presence present + Roll → `submitRoll` called once with
  `campaignId` from current presence and `{formula, rolls, total, visibility}`; the
  `useDiceAnimation.run` mock is not called until the `submitRoll` promise resolves; on
  `'success'` `sendState` → `'sent'` then `run` is called
  → task E5 · spec `global-dice-fab` MODIFIED "Checked with an active session persists the roll before animating"
- [ ] Checkbox unchecked + presence present + Roll → no `submitRoll` / `fetch`; `run` called
  immediately
  → task E5 · spec `global-dice-fab` MODIFIED "Unchecked makes a local roll with no network request"
- [ ] Checkbox checked + presence null + Roll → no `submitRoll` / `fetch`; `run` immediately
  → task E5 · spec `global-dice-fab` MODIFIED "No session presence makes a local roll…"
- [ ] `submitRoll` → `'error'` (and separately `'conflict'`) → `sendState` `'failed'`, retry
  affordance rendered, `run` still called, no unhandled rejection
  → task E5 · spec `global-dice-fab` MODIFIED "Failed persistence still animates the local result and offers retry"
- [ ] Percentile control follows the same path (build → maybe-persist → animate) with a
  two-d10 overlay
  → task E5 · spec `global-dice-fab` "Percentile roll animates two d10s and shows the decoded value"
- [ ] Roll + percentile controls disabled while `sendState === 'pending'`
  → task E5 · spec `global-dice-fab` MODIFIED "…persists the roll before animating" (no double-submit)
- [ ] "Disable Animation" checkbox reflects the resolved preference and toggling it persists
  → task E5 · spec `global-dice-fab` "Animation preference follows reduced-motion until explicitly set"
- [ ] The old post-roll "Send to session chat" **button** is gone; superseded
  `decouple-dice-roll-capability` button-click tests removed
  → task E5 · spec `global-dice-fab` MODIFIED "Send to session chat is a persisted checkbox…"

### E6 — Coverage reconciliation

- [ ] Every scenario in `specs/global-dice-fab/spec.md` and
  `specs/dice-pool-shared-state/spec.md` has at least one mapped passing test above
  → task E6

### E2E / smoke (`tests/e2e/…`, free port — not 3000)

- [ ] In an active session with animation enabled, rolling `2d6` shows the 3D dice settling
  on the exact face values that get persisted, then a total modal; roll appears in chat via
  SSE
  → tasks E3/E5 · spec `global-dice-fab` "Pool roll animates the staged dice and shows the total"
- [ ] Rolling a percentile shows two d10s and a decoded 1..100 total modal
  → tasks E3/E5 · spec `global-dice-fab` "Percentile roll animates two d10s…"
- [ ] Pressing Escape after a roll dismisses the overlay and leaves the dice panel open with
  the pool intact
  → task E4 · spec `global-dice-fab` "Escape closes only the overlay"
