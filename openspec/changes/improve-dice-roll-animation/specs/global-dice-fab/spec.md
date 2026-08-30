## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

_No new requirements are added by this change._

## MODIFIED Requirements

### Requirement: MODIFIED Rolling plays a dice animation then a total modal

The system SHALL, when the user rolls in `GlobalDiceFab` (a pool roll or a percentile
roll), present a dice-roll overlay that animates the staged dice coming to rest on their
already-decided face values and then displays a modal showing the roll total.

The roll outcome SHALL be decided before the animation begins, by the existing
`buildRoll()` / `buildPercentileRoll()` path (see `dice-pool-shared-state` capability); the
animation SHALL only visually settle on faces already chosen and SHALL NOT introduce any
new randomness or HTTP request of its own. The overlay SHALL be rendered through a
lazily created `document.body` overlay root, layered above the dice panel.

The dice animation SHALL be rendered inside a bounded, horizontally centered region, and
the dice SHALL be sized so that a die face is on roughly the same visual order as the
result modal's total text (a substantial increase over the library default). The animated
dice SHALL come to rest in the clear area directly above the result modal, such that the
settled dice and the total modal are visible at the same time; the dice SHALL NOT obscure
the total.

The result modal SHALL remain hidden until the dice animation reports completion. The
modal SHALL instead be shown immediately when the resolved "Disable Animation" preference
is `true`, or when the dice engine is unsupported (no WebGL / asset load failure / instant
path). If the animation never reports completion, the modal SHALL still be revealed after a
bounded fallback timeout so the user is never left without a result.

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
- **Then** the per-die values shown by the animation are exactly those in the built roll's
  breakdown, and no die value is generated or altered during or after the animation

## REMOVED Requirements

_No requirements are removed by this change._

## Traceability

- Proposal element "Dice ~500% larger, ≈ modal font size" -> Requirement "MODIFIED Rolling plays a dice animation then a total modal" (sizing clause) -> Scenario "Pool roll animates larger centered dice then reveals the modal".
- Proposal element "Animation centered on screen" -> same Requirement (bounded centered region clause) -> Scenarios "Pool roll animates larger centered dice then reveals the modal", "Percentile roll animates two centered d10s then reveals the decoded value".
- Proposal element "Dice land in the clear space just above the modal (both visible)" -> same Requirement (landing clause) -> Scenario "Pool roll animates larger centered dice then reveals the modal".
- Proposal element "Result modal hidden until the animation completes" -> same Requirement (gating clause) -> Scenarios "Modal stays hidden until the tumble settles", "Modal shows immediately when animation is disabled", "Modal shows immediately when the dice engine is unsupported".
- Proposal element "Safety timeout so the modal always appears" -> same Requirement (fallback clause) -> Scenario "Modal is revealed by the fallback timeout if completion never signals".
- Proposal element "Cap animated subset at 15" -> same Requirement (15-cap clause) -> Scenario "Large pools animate a capped subset of 15".
- Proposal element "Scale down when more than 6 dice animate" -> same Requirement (down-scaling clause) -> Scenario "More than six dice shrink to fit the clear zone".
- Proposal element "No new randomness / network / outcome change" -> same Requirement (outcome-decided clause) -> Scenario "Roll outcome is decided before the animation starts".
- Design Decision 1 (fixed scale + bounded container) -> sizing + centered-region clauses.
- Design Decision 2 (modal gating + fallback timeout) -> gating + fallback clauses.
- Design Decision 3 (land above the modal) -> landing clause.
- Design Decision 4 (`DICE_ANIM_CAP = 15`, `diceAnimationScale`) -> 15-cap + down-scaling clauses.
- Design Decision 5 (preserve fallback + dismissal semantics) -> "Modal shows immediately when the dice engine is unsupported" scenario; the unchanged "Dismissing the roll overlay leaves the dice panel open" requirement is regression-guarded (tasks.md).
- Requirement -> Task(s): see `openspec/changes/improve-dice-roll-animation/tasks.md` Execution steps E1–E6 and `openspec/changes/improve-dice-roll-animation/tests.md`.

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** the dice animation is enabled and has started
- **When** the animation fails to report completion within the bounded fallback timeout
  (context loss, backgrounded tab, or library hang)
- **Then** the overlay reveals the total modal with the correct total, leaving the user with
  a usable, dismissable result rather than a stuck overlay; the dice engine is released when
  the overlay is closed or the next roll begins (not by the timeout itself, which would cut
  a slow-but-still-running tumble)

### Requirement: Performance

#### Scenario: Bounded animation work

- **Given** any staged pool, including very large pools such as `120d6`
- **When** the user rolls with animation enabled
- **Then** at most 15 physical dice are simulated
- **And** the overlay issues no network request of its own (the dice-box module import is
  the only asset load, unchanged from the existing behavior)

### Requirement: Security

See functional scenario: "Roll outcome is decided before the animation starts" — the
animation introduces no new randomness, no HTTP request, and does not alter `built.total`
or `built.rolls`. No additional security scenario applies (this change is presentational
and adds no new inputs, endpoints, or trust boundaries).
