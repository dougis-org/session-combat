## Purpose

Provide a persistent lower-left dice fab, visible on every page for authenticated users, that opens a standalone dice-pool modal (including a percentile control) usable with no campaign or session context, and can send a result to session chat when dice-session presence exists.

## Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-22-decouple-dice-panel-from-chat/design.md) document, not a replacement.

### Requirement: Persistent dice fab visible on every page for authenticated users

The system SHALL render a fixed-position d20 icon button in the lower-left corner of every page, mounted once from the root layout, visible only to authenticated users.

#### Scenario: Fab renders for an authenticated user on any page

- **Given** a logged-in user (per `useAuth()`) navigates to any route in the app
- **When** the page renders
- **Then** a fixed-position button with an accessible name matching `/roll|dice/i` is present in the lower-left corner of the viewport

#### Scenario: Fab is absent for an unauthenticated user

- **Given** `useAuth()` reports `user: null` (not logged in, or session check still resolving to unauthenticated)
- **When** any page renders
- **Then** the dice fab is not present in the document (not merely disabled)

#### Scenario: Fab persists across client-side navigation

- **Given** a logged-in user is on one page with the fab visible
- **When** the user navigates client-side to a different route
- **Then** the fab remains visible without a full page reload, and its open/closed modal state is not preserved across the navigation (the modal closes, if open, on navigation)

---

### Requirement: Standalone dice pool modal with no session dependency

The system SHALL let an authenticated user open a modal anchored to the bottom-left corner over the trigger button from the fab that provides a dice pool builder (add/remove d4/d6/d8/d10/d12/d20, edit a shared modifier) and roll it using `rollDicePool()`, entirely independent of any campaign or session context, with no network request required to see a result. Each die control SHALL be rendered via the shared `DiePoolButton` component (see `dice-iconography` capability), showing the die's icon, staged count, and a persistent visible `d{sides}` label. The modal SHALL also present a standalone percentile control (shared `PercentileButton`, `d%` glyph) that produces a single percentile result via `buildPercentileRoll()` (see `dice-pool-shared-state` capability), separate from the staged pool.

#### Scenario: Opening the fab shows a modal anchored to the bottom-left

- **Given** the fab is visible and the modal is closed
- **When** the user clicks the fab
- **Then** a modal appears with its bottom-left corner overlaying the trigger button containing die add/remove controls for all six supported sizes and a modifier input
- **And** the background dimming overlay is displayed

#### Scenario: Each die control shows a persistent visible label

- **Given** the modal is open
- **When** the six die controls are inspected
- **Then** each renders the visible text `d{sides}` matching its own die size (as rendered content, not only a tooltip)

#### Scenario: Rolling with no active-session presence produces a local result and no network call

- **Given** the modal is open, no `CampaignChat` presence has been announced (see `dice-session-bridge` capability), and the pool has at least one die staged
- **When** the user rolls
- **Then** the modal displays the individual die results and total computed by `rollDicePool()`, and no HTTP request is made

#### Scenario: Empty pool cannot be rolled

- **Given** the modal is open and every die size has a staged count of 0
- **When** the user looks at the roll control
- **Then** the pool roll control is disabled (the standalone percentile control is unaffected by the staged-pool count)

#### Scenario: Percentile control produces a local d% result

- **Given** the modal is open and no presence has been announced
- **When** the user activates the percentile control
- **Then** the modal displays a result with `formula` `d%` and a total in 1..100 computed by `buildPercentileRoll()`, and no HTTP request is made

#### Scenario: A local percentile result is sendable to session chat on the same terms as a pool roll

- **Given** dice-session presence exists and the user has just produced a percentile result
- **When** the user clicks "send to session chat"
- **Then** the fab calls the shared `submitRoll` with `formula: "d%"`, `rolls: [value]`, `total: value`, and the current visibility, and `sendState` transitions per the shared submission result

---

### Requirement: ADDED Modal closes only on Escape or outside click, never on a timeout

The system SHALL close the standalone dice modal when the user presses Escape or clicks outside the modal, and SHALL NOT close it automatically after any elapsed time.

#### Scenario: Escape closes the modal

- **Given** the modal is open
- **When** the user presses the Escape key
- **Then** the modal is removed from the document

#### Scenario: Outside click closes the modal

- **Given** the modal is open
- **When** the user clicks anywhere outside the modal's boundary (and outside the fab trigger itself)
- **Then** the modal is removed from the document

#### Scenario: Modal remains open indefinitely absent Escape or outside click

- **Given** the modal is open and displaying a rolled result
- **When** an extended period of time elapses with no Escape press or outside click
- **Then** the modal remains open (no timer-driven auto-close exists in the component)

---

### Requirement: MODIFIED "Send to session chat" option appears only while a matching campaign session is present

_(Modified 2026-08-29, `decouple-dice-roll-capability`; modified again 2026-08-30, `add-dice-roll-animation`.)_ The system SHALL replace the post-roll "send to session chat" **button** with a persisted **checkbox** in the dice panel, shown only while the dice-session bridge (see `dice-session-bridge` capability) reports a non-null presence and omitted otherwise. When the checkbox is checked **and** a matching campaign session is present, clicking Roll (or the percentile control) SHALL submit the roll via the shared roll-submission capability (`lib/dice/useRollSubmission.ts`, see `dice-pool-shared-state` capability) with the current presence's `campaignId` and the rolled `{formula, rolls, total, visibility}` — the POST body SHALL be unchanged. The dice animation SHALL begin only after the submission resolves to `'success'` (HTTP 201). When the checkbox is unchecked, or no session presence exists, the roll SHALL be local only, SHALL issue no HTTP request, and the animation SHALL begin immediately. The checkbox state SHALL be persisted to `localStorage` and restored on mount. A failed persistence SHALL still animate the local result and show the existing retry affordance.

#### Scenario: Option hidden with no presence

- **Given** the dice panel is open and no presence has been announced
- **When** the panel is displayed
- **Then** no "send to session chat" checkbox is shown

#### Scenario: Checked with an active session persists the roll before animating

- **Given** presence is `{campaignId: "camp-1", sessionId: "sess-1"}` and the "send to
  session chat" checkbox is checked
- **When** the user clicks Roll
- **Then** `submitRoll` is called exactly once with `campaignId: "camp-1"` and the rolled
  `{formula, rolls, total, visibility}` (no extra fields)
- **And** the dice animation does not begin until `submitRoll` resolves
- **And** on a `'success'` result `sendState` transitions to `'sent'` and the animation
  then plays

#### Scenario: Unchecked makes a local roll with no network request

- **Given** presence exists but the "send to session chat" checkbox is unchecked
- **When** the user clicks Roll
- **Then** no HTTP request is issued and `submitRoll` is not called
- **And** the animation begins immediately

#### Scenario: No session presence makes a local roll even if the box is checked

- **Given** no dice-session presence has been announced and the checkbox is checked
- **When** the user clicks Roll
- **Then** no HTTP request is issued and the animation begins immediately

#### Scenario: Failed persistence still animates the local result and offers retry

- **Given** the checkbox is checked, presence exists, and the user clicks Roll
- **When** `submitRoll` resolves to `'conflict'` or `'error'`
- **Then** `sendState` transitions to `'failed'`, the existing retry affordance is shown
- **And** the dice animation still plays and the total modal is still shown for the
  already-decided local result
- **And** no exception is thrown

#### Scenario: Checkbox state persists across remount

- **Given** the user checks the "send to session chat" checkbox
- **When** the component unmounts and remounts while presence still exists
- **Then** the checkbox is still checked

---

### Requirement: ADDED Rolling plays a dice animation then a total modal

_(Added 2026-08-30, `add-dice-roll-animation`; modified 2026-08-30, `improve-dice-roll-animation` — larger centered dice, modal gated on completion, cap lowered to 15, down-scaling; modified 2026-08-30, `fix-dice-animation-predetermined-faces` — the 3D dice engine is replaced with one that natively honours predetermined per-die faces, engine + assets are self-hosted and lazy-loaded, and a reconciliation guard is added.)_

The system SHALL, when the user rolls in `GlobalDiceFab` (a pool roll or a percentile
roll), present a dice-roll overlay that animates the staged dice coming to rest on their
already-decided face values and then displays a modal showing the roll total and a per-die
readout of the rolled values.

The roll outcome SHALL be decided before the animation begins, by the existing
`buildRoll()` / `buildPercentileRoll()` path (see `dice-pool-shared-state` capability); the
animation SHALL only visually settle on faces already chosen and SHALL NOT introduce any
new randomness or HTTP request of its own. The overlay SHALL be rendered through a
lazily created `document.body` overlay root, layered above the dice panel.

The system SHALL pass the predetermined per-die faces to the dice engine using the
engine's supported forced-results notation, and the dice engine SHALL be one that honours
that notation. The animated physical dice SHALL settle showing those faces. When the
engine nonetheless settles on other faces, the overlay SHALL follow the reconciliation
behaviour in "Animated dice faces are reconciled against the decided roll" rather than
presenting the mismatched tumble as the result. The dice engine and its rendering assets
SHALL be self-hosted and loaded lazily (dynamic `import()`), never included in the initial
application bundle.

The dice animation SHALL be rendered inside a bounded, horizontally centered region, and
the dice SHALL be sized to be clearly readable at a 375px viewport width. The animated
dice SHALL come to rest in the clear area directly above the result modal, such that the
settled dice and the total modal are visible at the same time; the dice SHALL NOT obscure
the total or the per-die readout.

The result modal SHALL remain hidden until the dice animation reports completion (match),
is skipped (disabled / unsupported / face mismatch), or a bounded fallback timeout
elapses. The modal SHALL be shown immediately when the resolved "Disable Animation"
preference is `true`, or when the dice engine is unsupported (no WebGL / asset load
failure / instant path). If the animation never reports completion, the modal SHALL still
be revealed after the bounded fallback timeout so the user is never left without a result.

No more than 15 dice SHALL be animated regardless of pool size. The total modal and the
inline `formula → [rolls] = total` result line SHALL always show the exact total for the
entire pool. When more than 6 dice are animated, the dice SHALL be scaled down
progressively with the animated dice count so the settled cluster continues to fit the
clear area above the modal.

#### Scenario: Pool roll animates larger centered dice then reveals the modal

- **Given** the dice panel is open with a staged pool of `2d20+1d6` and modifier `+3`
- **When** the user clicks Roll
- **Then** the overlay opens with a bounded, horizontally centered dice canvas region
  positioned above where the result modal will appear (the canvas is not a full-viewport
  `inset-0` element)
- **And** the dice engine is configured with an explicit enlarged scale so the dice render
  far larger than the library default
- **And** the 2 d20 dice and 1 d6 die each settle on the value from the built roll's
  per-die breakdown
- **And** the total modal is NOT present in the document while the tumble is in progress
- **And** the inline `formula → [rolls] = total` result line IS rendered in the panel
  immediately
- **When** the dice settle and the animation reports completion
- **Then** the total modal appears below the settled dice, showing the roll total equal to
  `built.total`, with both the dice and the modal visible together

#### Scenario: Percentile roll animates two centered d10s then reveals the decoded value

- **Given** the dice panel is open
- **When** the user clicks the percentile control
- **Then** the overlay opens with two enlarged d10 dice in the centered canvas region,
  settling on the built roll's `percentileFaces`, and the total modal is not yet shown
- **When** the dice settle
- **Then** the total modal appears displaying the single decoded value in 1..100 equal to
  `built.total` (the persisted/inline value is unchanged; see `dice-pool-shared-state`
  capability)

#### Scenario: Modal stays hidden until the tumble settles

- **Given** animation is enabled and the dice engine is supported
- **When** the user rolls and the dice animation has started but not yet completed
- **Then** no element with `role="dialog"` for the roll result is present in the document
- **When** the animation reports completion
- **Then** the roll-result dialog is present

#### Scenario: Modal shows immediately when animation is disabled

- **Given** the resolved "Disable Animation" preference is `true`
- **When** the user rolls
- **Then** the overlay opens immediately with the total modal shown and no dice tumble is
  played
- **And** the inline result line still renders

#### Scenario: Modal shows immediately when the dice engine is unsupported

- **Given** the dice animation status is `unsupported` (no WebGL or the library/assets
  failed to load)
- **When** the user rolls
- **Then** the total modal is shown immediately with no dice tumble
- **And** the inline result line still renders

#### Scenario: Modal is revealed by the fallback timeout if completion never signals

- **Given** animation is enabled and started, but the animation never reports completion
  (e.g. the WebGL context is lost mid-roll)
- **When** the bounded fallback timeout elapses
- **Then** the total modal is revealed showing the roll total equal to `built.total`

#### Scenario: Roll outcome is decided before the animation starts

- **Given** any staged pool
- **When** the user rolls
- **Then** the per-die values shown by the animation are exactly those in the built roll's
  breakdown, and no die value is generated or altered during or after the animation

#### Scenario: Large pools animate a capped subset of 15

- **Given** a staged pool of 120 dice (e.g. `120d6`)
- **When** the user rolls with animation enabled
- **Then** no more than 15 dice are animated
- **And** the total modal and inline result show the exact total for all 120 dice

#### Scenario: More than six dice shrink to fit the clear zone

- **Given** a staged pool that animates 6 dice
- **When** the user rolls with animation enabled
- **Then** the dice engine is configured with the base (un-reduced) scale
- **Given** a staged pool that animates 10 dice
- **When** the user rolls with animation enabled
- **Then** the dice engine is configured with a scale strictly smaller than the base scale
- **And** a pool that animates 15 dice uses a scale no larger than the 10-dice scale and
  not below the defined minimum scale

#### Scenario: Roll outcome is decided before the animation starts

- **Given** any staged pool
- **When** the user rolls
- **Then** the per-die values shown in the result modal and inline line are exactly those
  in the built roll's breakdown, and no die value is generated or altered during or after
  the animation, regardless of what faces the engine settled on

---

### Requirement: ADDED Animated dice faces are reconciled against the decided roll

_(Added 2026-08-30, `fix-dice-animation-predetermined-faces`.)_

The system SHALL, after the dice engine reports that a roll has settled, compare the faces
the engine actually settled on against the predetermined per-die values for that roll (the
capped `breakdown`, or the two `percentileFaces` for a percentile roll).

The comparison SHALL be made per die-size group as an unordered multiset over the first
`animatedDiceCount()` dice of each group, so that a different die ordering returned by the
engine is not treated as a mismatch. Percentile faces SHALL be normalized (`0` and `10`
treated as equal) before comparison. The reconciliation step SHALL be a synchronous
comparison over the results the engine already returned: no additional `fetch` / XHR, and
no additional awaited engine round-trip.

- When the settled faces match the predetermined values, the overlay SHALL reveal the
  result modal through the normal animation-complete path.
- When the settled faces do not match, the system SHALL treat this as a transient per-roll
  condition: it SHALL NOT display or continue holding the mismatched tumble, it SHALL
  reveal the result modal promptly through the instant path (not by waiting out the bounded
  fallback timeout), it SHALL emit a single diagnostic event through the existing client
  logging seam, and it SHALL NOT latch the dice engine into the unsupported state — a
  subsequent roll SHALL still attempt the 3D animation.

The roll total and per-die values presented to the user (`built.total`, `built.rolls`,
`built.breakdown`, the inline result line, the persisted roll) SHALL be unchanged by the
reconciliation outcome.

#### Scenario: Settled faces match the decided roll

- **Given** animation is enabled and the dice engine is supported
- **And** the user rolls a staged pool of `2d12`
- **When** the dice engine settles with per-die results equal (as a multiset) to the built
  roll's `breakdown` values
- **Then** the result modal is revealed through the normal animation-complete path
- **And** no mismatch diagnostic is emitted

#### Scenario: Face mismatch reveals the result without showing a wrong tumble

- **Given** animation is enabled and the dice engine is supported
- **And** the user rolls a staged pool whose built breakdown is `[4, 3]`
- **When** the dice engine settles with per-die results that are not a multiset match for
  `[4, 3]` (e.g. `[7, 3]`)
- **Then** the mismatched tumble is not presented as the roll result
- **And** the result modal is revealed before the bounded fallback timeout would elapse,
  showing the total `7`
- **And** exactly one diagnostic event is emitted through the client logging seam
- **And** the dice animation status remains `idle` (not `unsupported`)

#### Scenario: A mismatch does not disable later animations

- **Given** a previous roll in the same mounted session was revealed via the mismatch path
- **When** the user rolls again with animation enabled
- **Then** the 3D dice animation is attempted again for the new roll

#### Scenario: Engine returns dice in a different order

- **Given** the user rolls `2d20+1d6` with built breakdown values `d20: [14, 2]`, `d6: [5]`
- **When** the dice engine returns settled results ordered `d6: 5`, `d20: 2`, `d20: 14`
- **Then** the reconciliation treats the roll as a match (multiset comparison per die-size
  group)

#### Scenario: Percentile face normalization

- **Given** a percentile roll whose `percentileFaces` are `[10, 10]` (decoded value `100`)
- **When** the dice engine returns two d10 results reported as `0` and `0`
- **Then** the reconciliation treats the roll as a match

---

### Requirement: ADDED Dismissing the roll overlay leaves the dice panel open

_(Added 2026-08-30, `add-dice-roll-animation`.)_ The system SHALL keep the dice-roll overlay and its total modal visible until the user dismisses them by pressing Escape or clicking/tapping outside the modal. Dismissal SHALL close only the overlay; the `GlobalDiceFab` dice panel SHALL remain open with the staged pool and modifier unchanged. The overlay's key/pointer dismissal handling SHALL take precedence over the dice panel's own Escape/outside-click close (see `dice-pool-shared-state` capability) so that a single Escape press does not also close the panel. A new roll while an overlay is open SHALL tear down that overlay and show a single new one (never two stacked overlays).

#### Scenario: Escape closes only the overlay

- **Given** the overlay with its total modal is open above the dice panel, and the panel
  has a staged pool of `3d6`
- **When** the user presses Escape once
- **Then** the overlay and total modal are removed from the document
- **And** the dice panel is still open with the `3d6` pool and modifier intact

#### Scenario: Outside click closes only the overlay

- **Given** the overlay with its total modal is open
- **When** the user clicks outside the modal content
- **Then** the overlay is removed and the dice panel remains open

#### Scenario: A new roll replaces an open overlay

- **Given** the overlay is open from a previous roll
- **When** the user rolls again
- **Then** the previous overlay is torn down and a single new overlay is shown

---

### Requirement: ADDED Animation preference follows reduced-motion until explicitly set

_(Added 2026-08-30, `add-dice-roll-animation`.)_ The system SHALL provide a "Disable Animation" checkbox in the dice panel. Its resolved value SHALL be: the user's explicitly stored choice when one exists, otherwise the value of `prefers-reduced-motion: reduce`. The first time the user toggles the checkbox, the choice SHALL be persisted to `localStorage` and SHALL take precedence over the media query from then on, even if the media query later changes. Storage being unavailable SHALL degrade to an in-session value without throwing.

#### Scenario: No stored choice, reduced motion requested

- **Given** no stored animation preference and `prefers-reduced-motion: reduce` matches
- **When** the dice panel opens
- **Then** the "Disable Animation" checkbox is checked and rolls skip the tumble

#### Scenario: No stored choice, reduced motion not requested

- **Given** no stored animation preference and `prefers-reduced-motion: reduce` does not match
- **When** the dice panel opens
- **Then** the "Disable Animation" checkbox is unchecked and rolls play the tumble

#### Scenario: Explicit choice overrides the media query

- **Given** the user has explicitly unchecked "Disable Animation" and
  `prefers-reduced-motion: reduce` matches
- **When** the user rolls
- **Then** the tumble is played, because the stored explicit choice wins over the media query

#### Scenario: Preference persists across remount

- **Given** the user checks "Disable Animation"
- **When** the component unmounts and remounts
- **Then** the checkbox is still checked

---

### Requirement: ADDED Sending to session chat succeeds whether or not CampaignChat is mounted

_(Added 2026-08-29, `decouple-dice-roll-capability`.)_ The system SHALL cause `GlobalDiceFab`'s "send to session chat" action to succeed based solely on whether dice-session presence exists (see `dice-session-bridge` capability), independent of whether any `CampaignChat` instance is currently mounted anywhere on the page.

#### Scenario: Send succeeds with presence but no mounted CampaignChat

- **Given** dice-session presence is `{campaignId: "c1", sessionId: "s1"}` (announced by a
  `CampaignChat` instance that has since unmounted, or by any future presence-announcing
  surface), and no `CampaignChat` instance is currently mounted
- **When** the user rolls in `GlobalDiceFab`'s modal and clicks "Send to session chat"
- **Then** the roll is submitted to `/api/campaigns/c1/rolls` and the send succeeds
  (`sendState` transitions to `'sent'` on a 201 response), exactly as it would if
  `CampaignChat` were mounted

#### Scenario: Send fails only for genuine submission errors, not for absent chat

- **Given** presence exists and the user clicks "Send to session chat"
- **When** the server responds with a non-201, non-409 status or the request throws
- **Then** `sendState` transitions to `'failed'`, and the failure reason is a real
  submission error — never "no CampaignChat instance available to receive the request"

---

## Traceability

- Proposal element "Persistent d20 icon, lower-left corner, every page, requires login" → Requirements: ADDED Persistent dice fab visible on every page for authenticated users
- Proposal element "Center-screen modal, pool builder + result" → Requirements: ADDED Standalone dice pool modal with no session dependency
- Proposal element "Escape/outside-click close, no timeout" → Requirements: ADDED Modal closes only on Escape or outside click, never on a timeout
- Proposal element "Additional option to send the roll to session chat when applicable" → Requirements: ADDED "Send to session chat" option appears only while a matching campaign session is present
- Proposal element "Repositioning the GlobalDiceFab panel fixed to the bottom-left corner" → Requirements: MODIFIED Global Dice Panel Positioning
- Proposal element "Replacing native title attributes with custom instant tooltips" → Requirements: ADDED Instant tooltips for dice buttons
- Design decision 1 (global fab + modal, root-layout mount) → Requirements: all ADDED requirements in this capability
- Design decision 1 (Panel Positioning strategy) → Requirements: MODIFIED Global Dice Panel Positioning
- (2026-08-29, `decouple-dice-roll-capability`) Proposal "What Changes" (`GlobalDiceFab` updated to submit directly) → Requirements: MODIFIED "Send to session chat" option, ADDED Sending to session chat succeeds whether or not CampaignChat is mounted
- (2026-08-30, `add-dice-roll-animation`) 3D animation of staged dice + total modal → Requirement: ADDED Rolling plays a dice animation then a total modal
- (2026-08-30, `improve-dice-roll-animation`, issue #596) larger centered dice, result modal gated on animation completion, animated-dice cap 30 → 15, progressive down-scaling past 6 dice → Requirement: ADDED (modified) Rolling plays a dice animation then a total modal. See `openspec/changes/archive/2026-08-30-improve-dice-roll-animation/`.
- (2026-08-30, `add-dice-roll-animation`) overlay persists, dismiss closes only the overlay → Requirement: ADDED Dismissing the roll overlay leaves the dice panel open
- (2026-08-30, `add-dice-roll-animation`) "Disable Animation" checkbox, reduced-motion default, stored override → Requirement: ADDED Animation preference follows reduced-motion until explicitly set
- (2026-08-30, `add-dice-roll-animation`) "Send to session chat" → persisted checkbox, auto-submit on Roll, animate after persist → Requirement: MODIFIED "Send to session chat" option. See `openspec/changes/archive/2026-08-30-add-dice-roll-animation/tasks.md`.
- Design decision 2 (Instant Tooltips implementation) → Requirements: ADDED Instant tooltips for dice buttons
- Requirement → Task(s): see `openspec/changes/archive/2026-08-22-decouple-dice-panel-from-chat/tasks.md`, "GlobalDiceFab" task group

## Non-Functional Acceptance Criteria

### Performance

#### Scenario: Modal mounts only while open

- **Given** the fab is rendered on a page but the modal has never been opened
- **When** the page's DOM is inspected
- **Then** no modal DOM subtree exists until the user first opens it (mirrors the existing content-driven, mount-on-open pattern already used for the in-chat dice pop-out)

#### Scenario: Dice animation code is not in the initial bundle

_(Added 2026-08-30, `add-dice-roll-animation`; modified 2026-08-30, `fix-dice-animation-predetermined-faces` — engine is now `@drdreo/dice-box-threejs`.)_

- **Given** a production build of the app
- **When** the entry/first-load JavaScript chunks are inspected
- **Then** the 3D dice library package (`@drdreo/dice-box-threejs`, and any bundled
  `three` / `cannon-es`) and its runtime assets are absent from them, and are requested
  only when the first animated roll needs them

#### Scenario: Reconciliation adds no round-trip or network cost

_(Added 2026-08-30, `fix-dice-animation-predetermined-faces`.)_

- **Given** a roll has been animated and the dice engine has reported its settled results
- **When** the reconciliation step runs
- **Then** it completes as a synchronous comparison with no `fetch` / XHR and no additional
  `roll()` / `reroll()` call
- **And** the result modal reveal for a matched roll occurs within the existing animation
  timeout budget with no added delay

### Reliability — roll animation

_(Added 2026-08-30, `add-dice-roll-animation`.)_

#### Scenario: Roll result survives an animation failure

- **Given** WebGL is unavailable, or the 3D library assets fail to load or time out
- **When** the user rolls
- **Then** the overlay opens with the total modal and no visible dice canvas band
- **And** the inline `formula → [rolls] = total` result is shown
- **And** for the remainder of the session, rolls use the instant path without retrying the
  failed asset load

#### Scenario: Result modal is revealed even if the animation never signals completion

_(Added 2026-08-30, `improve-dice-roll-animation`.)_

- **Given** the dice animation is enabled and has started
- **When** the animation fails to report completion within the bounded fallback timeout
  (context loss, backgrounded tab, or library hang)
- **Then** the overlay reveals the total modal with the correct total, leaving the user with
  a usable, dismissable result rather than a stuck overlay; the dice engine is released when
  the overlay is closed or the next roll begins (not by the timeout itself)

### Operability — roll animation

_(Added 2026-08-30, `add-dice-roll-animation`.)_

#### Scenario: Animation failure is logged once and not shown to the user

- **Given** the 3D library fails to initialize
- **When** the fallback to the instant path occurs
- **Then** a single diagnostic event is emitted via the existing client logging seam
- **And** no error message or broken overlay is presented to the user

#### Scenario: A face mismatch is logged once and distinguishable

_(Added 2026-08-30, `fix-dice-animation-predetermined-faces`.)_

- **Given** the dice engine settles on faces that do not match the decided roll
- **When** the mismatch path runs
- **Then** a single diagnostic event is emitted through the existing client logging seam,
  with a message distinct from the malformed-`roll()` error and from the
  persistent-unsupported warning
- **And** a second mismatch within the same mounted hook does not emit a further event
- **And** no error message or broken overlay is shown to the user

### Security

See functional scenario: "Fab is absent for an unauthenticated user". No additional access-control surface is introduced: as of `decouple-dice-roll-capability` (2026-08-29), the fab submits directly to `/api/campaigns/[id]/rolls` via the shared `lib/dice/useRollSubmission.ts` capability (see `dice-pool-shared-state`) rather than through `CampaignChat`, but that server route (see `roll-share-ui` capability) remains the sole authorization/validation boundary and is unaffected by this change.

### Reliability

#### Scenario: No `document` access during server render

- **Given** the fab (including its modal) is rendered in a Node.js (non-browser) environment
- **When** the module is imported and the component tree is server-rendered
- **Then** no `document`/portal-root access is attempted, matching the existing SSR-safety pattern already established for the in-chat dice pop-out (`CampaignChat.dicePool.ssr.test.tsx`)
