## ADDED Requirements

This document details *changes* to requirements and is additive to the
[`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Animated dice faces are reconciled against the decided roll

The system SHALL, after the dice engine reports that a roll has settled, compare
the faces the engine actually settled on against the predetermined per-die values
for that roll (the capped `breakdown`, or the two `percentileFaces` for a
percentile roll).

The comparison SHALL be made per die-size group as an unordered multiset over the
first `animatedDiceCount()` dice of each group, so that a different die ordering
returned by the engine is not treated as a mismatch. Percentile faces SHALL be
normalized (`0` and `10` treated as equal) before comparison.

- When the settled faces match the predetermined values, the overlay SHALL
  reveal the result modal through the normal animation-complete path.
- When the settled faces do not match, the system SHALL treat this as a
  transient per-roll condition: it SHALL NOT display or continue holding the
  mismatched tumble, it SHALL reveal the result modal promptly through the
  instant path (not by waiting out the bounded fallback timeout), it SHALL emit
  a single diagnostic event through the existing client logging seam, and it
  SHALL NOT latch the dice engine into the unsupported state — a subsequent roll
  SHALL still attempt the 3D animation.

The roll total and per-die values presented to the user (`built.total`,
`built.rolls`, the inline result line, the persisted roll) SHALL be unchanged by
the reconciliation outcome.

#### Scenario: Settled faces match the decided roll

- **Given** animation is enabled and the dice engine is supported
- **And** the user rolls a staged pool of `2d12`
- **When** the dice engine settles with per-die results equal (as a multiset) to
  the built roll's `breakdown` values
- **Then** the result modal is revealed through the normal animation-complete
  path
- **And** no mismatch diagnostic is emitted

#### Scenario: Face mismatch reveals the result without showing a wrong tumble

- **Given** animation is enabled and the dice engine is supported
- **And** the user rolls a staged pool whose built breakdown is `[4, 3]`
- **When** the dice engine settles with per-die results that are not a multiset
  match for `[4, 3]` (e.g. `[7, 3]`)
- **Then** the mismatched tumble is not presented as the roll result
- **And** the result modal is revealed before the bounded fallback timeout would
  elapse, showing the total `7`
- **And** exactly one diagnostic event is emitted through the client logging seam
- **And** the dice animation status remains `idle` (not `unsupported`)

#### Scenario: A mismatch does not disable later animations

- **Given** a previous roll in the same mounted session was revealed via the
  mismatch path
- **When** the user rolls again with animation enabled
- **Then** the 3D dice animation is attempted again for the new roll

#### Scenario: Engine returns dice in a different order

- **Given** the user rolls `2d20+1d6` with built breakdown values
  `d20: [14, 2]`, `d6: [5]`
- **When** the dice engine returns settled results ordered `d6: 5`, `d20: 2`,
  `d20: 14`
- **Then** the reconciliation treats the roll as a match (multiset comparison per
  die-size group)

#### Scenario: Percentile face normalization

- **Given** a percentile roll whose `percentileFaces` are `[10, 10]` (decoded
  value `100`)
- **When** the dice engine returns two d10 results reported as `0` and `0`
- **Then** the reconciliation treats the roll as a match

### Requirement: ADDED Result modal shows the per-die rolled values

The system SHALL render, in the dice-roll result modal, a per-die readout of the
rolled values in addition to the roll total. The readout SHALL be plain DOM text
(not dependent on the WebGL canvas), legible at a 375px viewport width, and
SHALL be derived from the built roll's `breakdown` (pool rolls) or
`percentileFaces` (percentile rolls).

The readout SHALL be present on every path that reveals the result modal:
animation completed, animation disabled, dice engine unsupported, fallback
timeout, and the face-mismatch path. When the pool exceeds the 15-die animation
cap, the readout SHALL show the animated subset and indicate the count of
additional dice; the total SHALL remain the exact total for the entire pool.

#### Scenario: Per-die values shown after a pool roll

- **Given** the user rolls a staged pool of `2d12` with built breakdown `[4, 3]`
- **When** the result modal is revealed
- **Then** the modal shows a per-die readout containing `4` and `3` as well as
  the total `7`

#### Scenario: Per-die readout is shown when animation is disabled

- **Given** the resolved "Disable Animation" preference is `true`
- **When** the user rolls a staged pool of `3d6`
- **Then** the result modal is shown immediately and includes the per-die readout
  for all three dice

#### Scenario: Per-die readout is shown when the dice engine is unsupported

- **Given** the dice animation status is `unsupported`
- **When** the user rolls
- **Then** the result modal is shown immediately and includes the per-die readout

#### Scenario: Percentile readout shows the two d10 faces

- **Given** a percentile roll whose `percentileFaces` are `[4, 2]` (decoded `42`)
- **When** the result modal is revealed
- **Then** the modal shows the two d10 faces and the decoded total `42`

#### Scenario: Large pool readout shows the animated subset and a remainder count

- **Given** the user rolls a staged pool of `120d6`
- **When** the result modal is revealed
- **Then** the per-die readout shows 15 values and indicates that 105 further
  dice were rolled
- **And** the total shown is the exact total for all 120 dice

## MODIFIED Requirements

### Requirement: MODIFIED Rolling plays a dice animation then a total modal

The system SHALL, when the user rolls in `GlobalDiceFab` (a pool roll or a
percentile roll), present a dice-roll overlay that animates the staged dice
coming to rest, then displays a modal showing the roll total **and a per-die
readout of the rolled values**.

_(Added 2026-08-30, `add-dice-roll-animation`; modified 2026-08-30,
`improve-dice-roll-animation`; modified by `fix-dice-animation-predetermined-faces`
— animated dice enlarged further, engine fidelity qualified, per-die readout added
to the modal, reconciliation guard introduced.)_

The roll outcome SHALL be decided before the animation begins, by the existing
`buildRoll()` / `buildPercentileRoll()` path (see `dice-pool-shared-state`
capability); the animation SHALL NOT introduce any new randomness or HTTP request
of its own. The overlay SHALL be rendered through a lazily created
`document.body` overlay root, layered above the dice panel.

The system SHALL pass the predetermined per-die faces to the dice engine using
an engine-supported mechanism for forced results. The animated physical dice
SHALL settle showing those faces **when the dice engine honors the forced
results**; when the engine settles on other faces, the overlay SHALL follow the
reconciliation behavior in "Animated dice faces are reconciled against the
decided roll" rather than presenting the mismatched tumble as the result.

The dice animation SHALL be rendered inside a bounded, horizontally centered
region, and the dice SHALL be sized to be clearly readable at a 375px viewport
width — a further increase over the previous enlarged size. The animated dice
SHALL come to rest in the clear area directly above the result modal, such that
the settled dice and the total modal are visible at the same time; the dice
SHALL NOT obscure the total or the per-die readout.

The result modal SHALL remain hidden until the dice animation reports completion
(match), is skipped (disabled / unsupported / face mismatch), or the bounded
fallback timeout elapses. No more than 15 dice SHALL be animated regardless of
pool size. The total modal and the inline `formula → [rolls] = total` result line
SHALL always show the exact total for the entire pool. When more than 6 dice are
animated, the dice SHALL be scaled down progressively with the animated dice
count, floored at the defined minimum scale, so the settled cluster continues to
fit the clear area above the modal.

#### Scenario: Pool roll animates enlarged dice then reveals the modal with a per-die readout

- **Given** the dice panel is open with a staged pool of `2d20+1d6` and modifier
  `+3`
- **When** the user clicks Roll
- **Then** the overlay opens with a bounded, horizontally centered dice canvas
  region positioned above where the result modal will appear (the canvas is not a
  full-viewport `inset-0` element)
- **And** the dice engine is configured with an explicit scale larger than the
  previous enlarged base scale, and is given the predetermined per-die faces via
  the engine's forced-results mechanism
- **And** the total modal is NOT present in the document while the tumble is in
  progress
- **And** the inline `formula → [rolls] = total` result line IS rendered in the
  panel immediately
- **When** the dice settle and reconciliation confirms a match
- **Then** the total modal appears below the settled dice, showing the total
  equal to `built.total` and a per-die readout of the `d20` and `d6` values,
  with the dice and the modal visible together

#### Scenario: Percentile roll animates two enlarged d10s then reveals the decoded value and faces

- **Given** the dice panel is open
- **When** the user clicks the percentile control
- **Then** the overlay opens with two enlarged d10 dice in the centered canvas
  region, given the built roll's `percentileFaces` via the forced-results
  mechanism, and the total modal is not yet shown
- **When** the dice settle and reconciliation confirms a match (with `0`/`10`
  normalization)
- **Then** the total modal appears displaying the decoded value in 1..100 equal
  to `built.total` and the two d10 faces (the persisted / inline value is
  unchanged; see `dice-pool-shared-state` capability)

#### Scenario: Roll outcome is decided before the animation starts

- **Given** any staged pool
- **When** the user rolls
- **Then** the per-die values shown in the result modal and inline line are
  exactly those in the built roll's breakdown, and no die value is generated or
  altered during or after the animation, regardless of what faces the engine
  settled on

#### Scenario: Large pools animate a capped subset of 15

- **Given** a staged pool of 120 dice (e.g. `120d6`)
- **When** the user rolls with animation enabled
- **Then** no more than 15 dice are animated
- **And** the total modal and inline result show the exact total for all 120 dice

#### Scenario: More than six dice shrink to fit the clear zone

- **Given** a staged pool that animates 6 dice
- **When** the user rolls with animation enabled
- **Then** the dice engine is configured with the base (un-reduced) enlarged scale
- **Given** a staged pool that animates 10 dice
- **When** the user rolls with animation enabled
- **Then** the dice engine is configured with a scale strictly smaller than the
  base scale
- **And** a pool that animates 15 dice uses a scale no larger than the 10-dice
  scale and not below the defined minimum scale

## REMOVED Requirements

_None._ This change modifies the existing animation requirement and adds two new
requirements; no requirement is removed.

## Traceability

- Proposal element "Repair the predetermined-value path" -> Requirement
  "MODIFIED Rolling plays a dice animation then a total modal" (forced-results
  mechanism clause).
- Proposal element "Reconciliation guard on `box.roll()` results" -> Requirement
  "ADDED Animated dice faces are reconciled against the decided roll".
- Proposal element "E2E asserts per-die faces" -> Requirement "ADDED Animated
  dice faces are reconciled against the decided roll" (scenario "Settled faces
  match the decided roll") + `tasks.md` E2E task.
- Proposal element "Legibility — bigger dice, readable per-die values" ->
  Requirements "ADDED Result modal shows the per-die rolled values" and the size
  clauses of "MODIFIED Rolling plays a dice animation then a total modal".
- Proposal element "No change to `built.total` / `built.rolls`" -> "MODIFIED
  Rolling plays a dice animation then a total modal" (scenario "Roll outcome is
  decided before the animation starts") + "ADDED Animated dice faces are
  reconciled…" (final paragraph).
- Design Decision 1 (spike) -> "MODIFIED Rolling…" forced-results clause
  (mechanism left engine-defined).
- Design Decision 2 (`toDiceBoxNotation` shape) -> "MODIFIED Rolling…"
  forced-results clause.
- Design Decision 3 (reconciliation) -> "ADDED Animated dice faces are
  reconciled against the decided roll".
- Design Decision 4 (fallback: detect + skip) -> "ADDED Animated dice faces are
  reconciled…" mismatch bullet + "MODIFIED Rolling…" ("rather than presenting the
  mismatched tumble").
- Design Decision 5 (legibility) -> "ADDED Result modal shows the per-die rolled
  values" + "MODIFIED Rolling…" size clauses.
- Requirement "ADDED Animated dice faces are reconciled…" -> `tasks.md` tasks:
  "Capture and reconcile engine results", "Classify mismatch as transient",
  "E2E: assert settled faces".
- Requirement "ADDED Result modal shows the per-die rolled values" -> `tasks.md`
  tasks: "Add per-die readout to the result modal", "Readout on all reveal
  paths".
- Requirement "MODIFIED Rolling…" -> `tasks.md` tasks: "Spike the dice-box forced
  API", "Rewrite `toDiceBoxNotation`", "Raise scale / retune curve",
  "Enlarge canvas band".

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Reconciliation adds no round-trip or network cost

- **Given** a roll has been animated and the dice engine has reported its settled
  results
- **When** the reconciliation step runs
- **Then** it completes as a synchronous comparison with no `fetch` / XHR and,
  in the no-reroll design, no additional `roll()` / `reroll()` call
- **And** the result modal reveal for a matched roll occurs within the existing
  `ROLL_TIMEOUT_MS` animation budget with no added delay

### Requirement: Security

See functional scenarios in the base `global-dice-fab` spec ("Fab is absent for
an unauthenticated user") and `dice-pool-shared-state` / `roll-share-ui`. This
change introduces no new access-control surface: it is presentational and
client-only, reads existing `BuiltRoll` data, adds no route, and the server roll
route remains the sole authorization/validation boundary.

### Requirement: Reliability

#### Scenario: Recovery behavior — result is always reachable

- **Given** any combination of: WebGL unavailable, dice engine import/init
  failure, a thrown `roll()` error, a face mismatch, or an animation that never
  reports completion
- **When** the user rolls
- **Then** the result modal is revealed with the correct `built.total` and the
  per-die readout, via the instant path or the bounded fallback timeout, and the
  user is never left without a dismissable result

### Requirement: Operability

#### Scenario: Diagnostics — a face mismatch is logged once and distinguishable

- **Given** the dice engine settles on faces that do not match the decided roll
- **When** the mismatch path runs
- **Then** a single diagnostic event is emitted through the existing client
  logging seam, with a message distinct from the malformed-`roll()` error and
  from the persistent-unsupported warning
- **And** a second mismatch within the same mounted hook does not emit a further
  event
- **And** no error message or broken overlay is shown to the user
