## MODIFIED Requirements

This document details *changes* to requirements and is additive to the
[`design.md`](../../design.md) document, not a replacement.

### Requirement: MODIFIED Rolling plays a dice animation then a total modal

The system SHALL, when the user rolls in `GlobalDiceFab` (a pool roll or a
percentile roll), present a dice-roll overlay that animates the staged dice
coming to rest **on their already-decided face values**, then displays a modal
showing the roll total and a **numeric per-die readout** of the rolled values.

_(Added 2026-08-30, `add-dice-roll-animation`; modified 2026-08-30,
`improve-dice-roll-animation`; modified 2026-08-30,
`fix-dice-animation-predetermined-faces` — engine replaced with one honouring
predetermined faces, reconciliation guard added; modified by
`enhance-dice-modal-numeric-readout` — the result modal's per-die readout is a
plain numeric echo of each rolled value with a small `d{sides}` size tag, with
no die-face SVG graphic, no pips, and no number-over-icon overlay.)_

The roll outcome SHALL be decided before the animation begins, by the existing
`buildRoll()` / `buildPercentileRoll()` path (see `dice-pool-shared-state`
capability); the animation SHALL only visually settle on faces already chosen and
SHALL NOT introduce any new randomness or HTTP request of its own. The overlay
SHALL be rendered through a lazily created `document.body` overlay root, layered
above the dice panel.

The system SHALL pass the predetermined per-die faces to the dice engine using
the engine's supported forced-results notation. The animated physical dice SHALL
settle showing those faces. When the engine settles on other faces, the overlay
SHALL follow the reconciliation behaviour in "Animated dice faces are reconciled
against the decided roll" rather than presenting the mismatched tumble as the
result. The dice engine and its rendering assets SHALL be self-hosted and loaded
lazily (dynamic `import()`), never in the initial application bundle.

The dice animation SHALL be rendered inside a bounded, horizontally centered
region, sized to be clearly readable at a 375px viewport width, coming to rest in
the clear area directly above the result modal so the settled dice and the modal
are visible together; the dice SHALL NOT obscure the total or the per-die readout.

The result modal SHALL remain hidden until the dice animation reports completion
(match), is skipped (disabled / unsupported / face mismatch), or the bounded
fallback timeout elapses. No more than 15 dice SHALL be animated regardless of
pool size. The total modal and the inline `formula → [rolls] = total` result line
SHALL always show the exact total for the entire pool. When more than 6 dice are
animated, the dice SHALL be scaled down progressively, floored at the defined
minimum scale.

**Result modal per-die readout.** The per-die readout in the result modal SHALL,
for each rolled die it displays, present that die's **rolled numeric value** as
the dominant visible element together with a smaller, non-dominant `d{sides}`
size label (`d%` for a percentile face). The readout SHALL NOT render a die-face
or die-shape SVG graphic, pip pattern, or size-silhouette icon for the rolled
dice, and SHALL NOT position the value as an overlay on top of such a graphic.
Every displayed die SHALL be rendered through a single presentation path
regardless of die size, including a `sides` value with no dedicated icon. The
element carrying each die's value SHALL retain the `data-testid="die-face"` hook.
For a percentile roll the readout SHALL show two numeric face chips — the tens
face string (`00`..`90`) and the ones face string (`0`..`9`) derived from
`built.percentileFaces` — each with a `d%` label.

The readout SHALL display at most the first 15 dice of the pool
(`DICE_ANIM_CAP`), matching the animated subset; when the pool has more dice than
that, the readout SHALL additionally show a `+N more` note
(`data-testid="dice-readout-remainder"`) where `N` is the number of undisplayed
dice. The total shown below the readout SHALL always be the full-pool total,
independent of the cap.

The readout's content SHALL be a pure function of the built roll and SHALL be
identical on every path by which the modal is revealed (animation complete,
animation disabled, engine unsupported, or fallback timeout).

The `sr-only` `aria-live` result announcement (`"{formula} rolled {total}"`)
SHALL be unchanged by this requirement.

This change SHALL NOT alter `built.total`, `built.rolls`, `built.breakdown`,
`built.percentileFaces`, roll generation, persistence, the roll-submission
payload, or the pool-builder / fab die-type iconography (`DieGlyph`,
`DiePoolButton`, `DIE_ICONS`).

#### Scenario: Result modal per-die readout shows numeric values with a size tag

- **Given** the dice panel is open with a staged pool of `2d20 + 1d6` and the
  built roll's `breakdown` is `d20: [14, 2]`, `d6: [5]`
- **When** the result modal is revealed
- **Then** the readout contains exactly three `data-testid="die-face"` elements
  whose visible text is `14`, `2`, and `5`
- **And** each of those elements is accompanied by a smaller `d20`, `d20`, and
  `d6` label respectively, rendered as visible text (not only a tooltip)
- **And** the roll total shown below equals `built.total`

#### Scenario: Result modal readout renders no die-face graphic

- **Given** the result modal is revealed for any pool roll
- **When** the result dialog subtree is inspected
- **Then** it contains no `<svg>` element representing a rolled die's face or
  shape, and no pip pattern
- **And** no die's numeric value is rendered as an absolutely-positioned overlay
  on top of an icon

#### Scenario: Unknown die size renders through the same numeric path

- **Given** a built roll whose `breakdown` contains an entry with a `sides` value
  that has no dedicated die icon
- **When** the result modal is revealed
- **Then** that die is rendered as the same numeric value + `d{sides}` chip as
  every other die, with a `data-testid="die-face"` element carrying its value
- **And** no distinct bordered "fallback" die box is used

#### Scenario: Percentile result modal readout shows two numeric face chips

- **Given** a percentile roll whose `built.percentileFaces` is `[7, 0]` (decoded
  value `70`)
- **When** the result modal is revealed
- **Then** the readout shows two numeric chips reading `70` and `0`
- **And** each chip has a `d%` label and no `DiceD10Icon` / die-face SVG
- **And** the total line shows the decoded value equal to `built.total`

#### Scenario: Large pools still cap the readout at 15 with a remainder note

- **Given** a staged pool of `20d6` whose `breakdown` has 20 entries
- **When** the result modal is revealed
- **Then** the readout shows exactly 15 `data-testid="die-face"` chips
- **And** a `data-testid="dice-readout-remainder"` element reads `+5 more`
- **And** the total shown equals the sum of all 20 dice plus the modifier

#### Scenario: Readout is identical across modal reveal paths

- **Given** a fixed built roll
- **When** the modal is revealed via the animation-complete path, and separately
  via the animation-disabled path, the engine-unsupported path, and the
  fallback-timeout path
- **Then** the per-die readout (chips, values, size tags, and any `+N more` note)
  is identical in every case

#### Scenario: Roll outcome is decided before the animation starts

- **Given** any staged pool
- **When** the user rolls
- **Then** the per-die values shown in the result modal and inline line are
  exactly those in the built roll's breakdown, and no die value is generated or
  altered during or after the animation, regardless of what faces the engine
  settled on

#### Scenario: Modal stays hidden until the tumble settles

- **Given** animation is enabled and the dice engine is supported
- **When** the user rolls and the dice animation has started but not completed
- **Then** no element with `role="dialog"` for the roll result is present
- **When** the animation reports completion
- **Then** the roll-result dialog is present, containing the numeric per-die
  readout

#### Scenario: Modal shows immediately when animation is disabled

- **Given** the resolved "Disable Animation" preference is `true`
- **When** the user rolls
- **Then** the overlay opens immediately with the total modal shown, the numeric
  per-die readout rendered, and no dice tumble played

#### Scenario: Large pools animate a capped subset of 15

- **Given** a staged pool of 120 dice (e.g. `120d6`)
- **When** the user rolls with animation enabled
- **Then** no more than 15 dice are animated
- **And** the total modal and inline result show the exact total for all 120 dice

## Traceability

- Proposal element "Rewrite `StaticRollResult` to a numeric-chip readout" →
  Requirement "MODIFIED Rolling plays a dice animation then a total modal"
  (Result modal per-die readout clauses) → design Decision 1, Decision 2 →
  scenarios "Result modal per-die readout shows numeric values with a size tag",
  "Result modal readout renders no die-face graphic", "Unknown die size renders
  through the same numeric path".
- Proposal element "Percentile readout uses the same styling, no `DiceD10Icon`" →
  same requirement → design Decision 3 → scenario "Percentile result modal
  readout shows two numeric face chips".
- Proposal element "Keep the 15-die display cap and `+N more`" → same requirement
  (cap clause) → design Decision 4 → scenario "Large pools still cap the readout
  at 15 with a remainder note".
- Proposal element "`DIE_ICONS` / `dice.tsx` stay in the codebase" → same
  requirement (final non-alteration clause) → design Decision 5 → existing
  `dice-iconography` scenarios remain unchanged.
- Proposal element "No change to roll values / reveal gating / a11y" → same
  requirement (pure-function + `aria-live` clauses) → design Goals/Non-Goals →
  scenarios "Readout is identical across modal reveal paths", "Roll outcome is
  decided before the animation starts", NFAC Operability scenario.
- Requirement → Task(s): see `tasks.md` Execution items E1 (component rewrite),
  E2 (percentile), E3 (cap retained), E4 (spec/tests), Validation V1–V5.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No new runtime cost

- **Given** a production build of the application
- **When** the main and lazy chunks are inspected after this change
- **Then** no new module, chunk, asset, or network request is introduced
- **And** the result-modal render emits fewer DOM nodes than before (no die-face
  `<svg>` paths), never more

### Requirement: Security

See functional scenarios in the base `global-dice-fab` spec ("Fab is absent for
an unauthenticated user") and `dice-pool-shared-state` / `roll-share-ui`. This
change introduces no new access-control surface: it is presentational and
client-only, reads existing `BuiltRoll` data, adds no route, no input parsing,
and no dependency, and the server roll route remains the sole
authorization/validation boundary.

### Requirement: Reliability

#### Scenario: Readout is identical across reveal paths

- **Given** a fixed built roll
- **When** the result modal is mounted through each reveal trigger
  (`disableAnimation`, `animationStatus: 'unsupported'`, `animationSettled`,
  fallback timeout)
- **Then** the rendered per-die readout is byte-for-byte identical across all
  four, because it is a pure function of `built`

### Requirement: Operability

#### Scenario: Screen-reader announcement is unchanged

- **Given** the result overlay is mounted for a roll
- **When** the `sr-only` `role="status" aria-live="polite"` region is read a tick
  after mount
- **Then** its text is `"{formula} rolled {total}"`, unchanged by this change
- **And** the numeric chips are supplementary visual detail, not the primary
  assistive-tech announcement
