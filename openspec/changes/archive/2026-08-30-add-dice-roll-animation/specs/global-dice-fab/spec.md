## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Rolling plays a dice animation then a total modal

The system SHALL, when the user rolls in `GlobalDiceFab` (a pool roll or a percentile
roll), present a dice-roll overlay that animates the staged dice coming to rest on their
already-decided face values and then displays a modal showing the roll total. The roll
outcome SHALL be decided before the animation begins, by the existing
`buildRoll()` / `buildPercentileRoll()` path (see `dice-pool-shared-state` capability); the
animation SHALL only visually settle on faces already chosen and SHALL NOT introduce any
new randomness or HTTP request of its own. The overlay SHALL be rendered through a
lazily created `document.body` overlay root, layered above the dice panel.

#### Scenario: Pool roll animates the staged dice and shows the total

- **Given** the dice panel is open with a staged pool of `2d20+1d6` and modifier `+3`
- **When** the user clicks Roll
- **Then** the overlay opens showing a dice animation of 2 d20 dice and 1 d6 die, each
  settling on the value from the built roll's per-die breakdown
- **And** when the dice settle, a modal is shown displaying the roll total equal to
  `built.total`
- **And** the inline `formula → [rolls] = total` result line is also rendered in the panel

#### Scenario: Percentile roll animates two d10s and shows the decoded value

- **Given** the dice panel is open
- **When** the user clicks the percentile control
- **Then** the overlay opens showing two d10 dice settling on the built roll's
  `percentileFaces`
- **And** the total modal displays the single decoded value in 1..100 equal to `built.total`
  (the persisted/inline value is unchanged; see `dice-pool-shared-state` capability)

#### Scenario: Animation is skipped when animation is disabled

- **Given** the resolved "Disable Animation" preference is `true`
- **When** the user rolls
- **Then** the overlay opens immediately with the total modal and no dice tumble is played
- **And** the inline result line still renders

#### Scenario: Roll outcome is decided before the animation starts

- **Given** any staged pool
- **When** the user rolls
- **Then** the per-die values shown by the animation are exactly those in the built roll's
  breakdown, and no die value is generated or altered during or after the animation

---

### Requirement: ADDED Dismissing the roll overlay leaves the dice panel open

The system SHALL keep the dice-roll overlay and its total modal visible until the user
dismisses them by pressing Escape or clicking/tapping outside the modal. Dismissal SHALL
close only the overlay; the `GlobalDiceFab` dice panel SHALL remain open with the staged
pool and modifier unchanged. The overlay's key/pointer dismissal handling SHALL take
precedence over the dice panel's own Escape/outside-click close (see
`dice-pool-shared-state` capability) so that a single Escape press does not also close the
panel.

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
- **Then** the previous overlay is torn down and a single new overlay is shown (never two
  stacked overlays)

---

### Requirement: ADDED Animation preference follows reduced-motion until explicitly set

The system SHALL provide a "Disable Animation" checkbox in the dice panel. Its resolved
value SHALL be: the user's explicitly stored choice when one exists, otherwise the value of
`prefers-reduced-motion: reduce`. The first time the user toggles the checkbox, the choice
SHALL be persisted to `localStorage` and SHALL take precedence over the media query from
then on, even if the media query later changes. Storage being unavailable SHALL degrade to
an in-session value without throwing.

#### Scenario: No stored choice, reduced motion requested

- **Given** no stored animation preference and `prefers-reduced-motion: reduce` matches
- **When** the dice panel opens
- **Then** the "Disable Animation" checkbox is checked and rolls skip the tumble

#### Scenario: No stored choice, reduced motion not requested

- **Given** no stored animation preference and `prefers-reduced-motion: reduce` does not
  match
- **When** the dice panel opens
- **Then** the "Disable Animation" checkbox is unchecked and rolls play the tumble

#### Scenario: Explicit choice overrides the media query

- **Given** the user has explicitly unchecked "Disable Animation" and
  `prefers-reduced-motion: reduce` matches
- **When** the user rolls
- **Then** the tumble is played, because the stored explicit choice wins over the media
  query

#### Scenario: Preference persists across remount

- **Given** the user checks "Disable Animation"
- **When** the component unmounts and remounts
- **Then** the checkbox is still checked

---

## MODIFIED Requirements

### Requirement: "Send to session chat" option appears only while a matching campaign session is present

The system SHALL replace the post-roll "send to session chat" **button** with a persisted
**checkbox** in the dice panel, shown only while the dice-session bridge (see
`dice-session-bridge` capability) reports a non-null presence and omitted otherwise. When
the checkbox is checked **and** a matching campaign session is present, clicking Roll (or
the percentile control) SHALL submit the roll via the shared roll-submission capability
(`lib/dice/useRollSubmission.ts`, see `dice-pool-shared-state` capability) with the current
presence's `campaignId` and the rolled `{formula, rolls, total, visibility}` — the POST
body SHALL be unchanged from today. The dice animation SHALL begin only after the
submission resolves to `'success'` (HTTP 201). When the checkbox is unchecked, or no
session presence exists, the roll SHALL be local only, SHALL issue no HTTP request, and the
animation SHALL begin immediately. The checkbox state SHALL be persisted to `localStorage`
and restored on mount.

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

#### Scenario: Option hidden with no presence

- **Given** the dice panel is open and no presence has been announced
- **When** the panel is displayed
- **Then** no "send to session chat" checkbox is shown

---

## Traceability

- Proposal element (3D animation of staged dice + total modal) -> Requirement: ADDED
  Rolling plays a dice animation then a total modal
- Proposal element (overlay persists, dismiss closes only overlay) -> Requirement: ADDED
  Dismissing the roll overlay leaves the dice panel open
- Proposal element ("Disable Animation" checkbox, reduced-motion default, stored override)
  -> Requirement: ADDED Animation preference follows reduced-motion until explicitly set
- Proposal element ("Send to session chat" -> persisted checkbox, auto-submit, animate
  after persist; the manual post-roll button is removed) -> Requirement: "Send to session
  chat" option appears only while a matching campaign session is present (MODIFIED)
- Design decision 1 (additive `BuiltRoll` seam) -> `dice-pool-shared-state` spec delta
- Design decision 2 (client-only lazy 3D library + fallback) -> NFAC Performance / Reliability
- Design decision 3 (build -> maybe-persist -> animate ordering) -> Requirement:
  "Send to session chat" ...; Requirement: ADDED Rolling plays a dice animation ...
- Design decision 4 (body-level portal overlay, capture-phase dismissal) -> Requirement:
  ADDED Dismissing the roll overlay leaves the dice panel open
- Design decision 5 (`LocalStore` preferences hook, tri-state) -> Requirement: ADDED
  Animation preference ...; MODIFIED "Send to session chat" ... (checkbox persistence)
- Design decision 6 (visual cap, percentile two d10s) -> NFAC Performance; ADDED Rolling
  plays a dice animation ... (percentile scenario)
- Design decision 7 (degradation path) -> NFAC Reliability / Operability
- Requirement: ADDED Rolling plays a dice animation then a total modal -> Task(s):
  animation hook, overlay component, roll-flow re-ordering, `toDiceBoxNotation`
- Requirement: ADDED Dismissing the roll overlay leaves the dice panel open -> Task(s):
  overlay component, capture-phase dismissal handler
- Requirement: ADDED Animation preference follows reduced-motion until explicitly set ->
  Task(s): `useDiceFabPreferences` hook, checkbox UI
- Requirement: MODIFIED "Send to session chat" is a persisted checkbox ... -> Task(s):
  checkbox UI, async `handleRoll`/`handlePercentileRoll`, preferences hook
- Requirement: REMOVED Post-roll "Send to session chat" button -> Task(s): remove button
  markup + superseded tests

## Non-Functional Acceptance Criteria

> NFAC scenarios below express non-functional behavior not already covered by the
> functional scenarios above.

### Requirement: Performance

#### Scenario: Dice animation code is not in the initial bundle

- **Given** a production build of the app
- **When** the entry/first-load JavaScript chunks are inspected
- **Then** the 3D dice library package and its runtime assets are absent from them, and are
  requested only when the first animated roll needs them

#### Scenario: Large pools animate a capped subset

- **Given** a staged pool of 120 dice (e.g. `120d6`)
- **When** the user rolls with animation enabled
- **Then** no more than `DICE_ANIM_CAP` (30) dice are animated
- **And** the total modal and inline result show the exact total for all 120 dice

### Requirement: Security

See functional scenarios: "Checked with an active session persists the roll before
animating" (asserts the exact `submitRoll` arguments and unchanged POST body) and, in the
`dice-pool-shared-state` spec delta, "Built rolls carry a per-die breakdown without
changing the submission payload". Library assets are same-origin (`public/`); no new
third-party origin is introduced, so no distinct security scenario is required.

### Requirement: Reliability

#### Scenario: Roll result survives an animation failure

- **Given** WebGL is unavailable, or the 3D library assets fail to load or time out
- **When** the user rolls
- **Then** the overlay opens with the total modal and no dice canvas
- **And** the inline `formula → [rolls] = total` result is shown
- **And** for the remainder of the session, rolls use the instant path without retrying the
  failed asset load

### Requirement: Operability

#### Scenario: Animation failure is logged once and not shown to the user

- **Given** the 3D library fails to initialize
- **When** the fallback to the instant path occurs
- **Then** a single diagnostic event is emitted via the existing client logging seam
- **And** no error message or broken overlay is presented to the user
