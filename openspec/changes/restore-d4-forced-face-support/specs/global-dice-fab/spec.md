## ADDED Requirements

This document details *changes* to requirements and is additive to the
[`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED The 3D dice engine's d4 forced-face support is restored via a vendored patch

The system SHALL restore predetermined-face ("`@`" notation) support for **d4**
dice in `@drdreo/dice-box-threejs@1.1.0` through a patch committed to this
repository and applied at dependency-install time, without depending on an
upstream release.

The patch SHALL be applied automatically by an install-time step (e.g.
`patch-package` via `postinstall`), SHALL fail the install loudly if it cannot be
applied cleanly, and SHALL be pinned to the exact engine version by its filename.
The patch SHALL NOT alter forcing behavior for any other die size, and SHALL NOT
introduce randomness, network calls, or changes to persisted roll data.

A parallel upstream pull request against `drdreo/dice-box-threejs` SHALL be
opened with an equivalent fix and a d4-forcing test; its URL SHALL be recorded in
`tasks.md` before this change is archived. Upstream merge SHALL NOT be a
precondition for archiving.

#### Scenario: Forced d4 lands on its target face

- **Given** the vendored patch is applied to the installed engine
- **When** the engine is driven with `roll("1d4@2")` in this app's
  headless-Chromium WebGL setup
- **Then** the returned d4 result has `value` equal to `2` and `reason` equal to
  `"forced"`
- **And** the call returns without hanging

#### Scenario: Forced d4 does not hang at a high iteration limit

- **Given** the vendored patch is applied to the installed engine
- **When** the engine is driven with `roll("1d4@3")` configured with
  `iterationLimit: 20000`
- **Then** the roll settles and returns within the hook's bounded roll timeout
- **And** the d4 shows face `3`

#### Scenario: Missing patch degrades to the instant reveal, never a hang

- **Given** a checkout where the install-time patch step did not run, so the
  engine still ignores `@` notation for d4
- **When** the user rolls a staged pool of `3d4` with animation enabled
- **Then** the reconciliation step detects a face mismatch for the d4 group
- **And** the result modal is revealed promptly through the instant path with the
  correct total
- **And** no roll hangs and no die value is altered

#### Scenario: Install-time patch failure is visible in CI

- **Given** the patch file no longer applies cleanly to the pinned engine version
- **When** dependencies are installed in CI
- **Then** the install step fails with a non-zero exit code before the unit and
  e2e jobs run

#### Scenario: A guard test catches a silently absent patch

- **Given** the engine file is installed
- **When** the unit test suite runs
- **Then** a test asserts the installed engine file contains the patch's marker
  string and fails if it is absent

## MODIFIED Requirements

### Requirement: MODIFIED Rolling plays a dice animation then a total modal

The system SHALL, when the user rolls in `GlobalDiceFab` (a pool roll or a
percentile roll), present a dice-roll overlay that animates the staged dice
coming to rest **on their already-decided face values**, then displays a modal
showing the roll total and a per-die readout of the rolled values.

_(Added 2026-08-30, `add-dice-roll-animation`; modified 2026-08-30,
`improve-dice-roll-animation`; modified by `fix-dice-animation-predetermined-faces`
— the 3D dice engine is replaced with one that natively honors predetermined
per-die faces, and a reconciliation guard is added; modified by
`restore-d4-forced-face-support` — d4 forcing is restored via a vendored engine
patch, so **all** supported die sizes animate on their decided faces.)_

The roll outcome SHALL be decided before the animation begins, by the existing
`buildRoll()` / `buildPercentileRoll()` path (see `dice-pool-shared-state`
capability); the animation SHALL only visually settle on faces already chosen and
SHALL NOT introduce any new randomness or HTTP request of its own.

The system SHALL pass the predetermined per-die faces to the dice engine using
the engine's supported forced-results notation, for **every** die size in a
standard D&D set — d4, d6, d8, d10, d12, d20, and percentile (rendered as two
d10s). `toDiceBoxNotation` SHALL emit forced ("`@`") notation for d4 groups
(`forced: true`), exactly as it does for the other sizes. No code path in
`toDiceBoxNotation`, `reconcileDiceFaces`, or `useDiceAnimation` SHALL
special-case `sides === 4`.

When the engine nonetheless settles on other faces (for any die size, including
d4 — e.g. because the vendored patch is absent), the overlay SHALL follow the
reconciliation behavior in "Animated dice faces are reconciled against the
decided roll" rather than presenting the mismatched tumble as the result.

The dice engine and its rendering assets SHALL be self-hosted and loaded lazily
(dynamic `import()`), never included in the initial application bundle. The
remaining size, scaling, cap (15 dice), and modal-visibility clauses of this
requirement are unchanged.

#### Scenario: d4 pool animates on its decided faces then reveals the modal

- **Given** the vendored patch is applied and animation is enabled
- **And** the dice panel is open with a staged pool of `3d4` and modifier `+1`
- **When** the user clicks Roll
- **Then** the dice engine is given the three predetermined d4 faces via its
  forced-results notation (`3d4@a,b,c`)
- **And** the three animated d4 dice settle showing exactly the built roll's
  per-die `d4` breakdown values
- **When** the dice settle and reconciliation confirms a match
- **Then** the total modal appears below the settled dice showing the total equal
  to `built.total`

#### Scenario: Mixed d4 + d6 pool forces both groups

- **Given** the vendored patch is applied and animation is enabled
- **And** the user rolls a staged pool of `2d4+3d6`
- **When** the roll is animated
- **Then** the d4 group is driven with `roll("2d4@…")` and the d6 group with a
  subsequent `add("3d6@…")` (no `+`-joined multi-size notation)
- **And** both groups settle on their predetermined faces and reconciliation
  confirms a match

#### Scenario: Roll outcome is decided before the animation starts

- **Given** any staged pool, including one containing d4 dice
- **When** the user rolls
- **Then** the per-die values shown in the result modal and inline line are
  exactly those in the built roll's breakdown, and no die value is generated or
  altered during or after the animation, regardless of what faces the engine
  settled on

## REMOVED Requirements

_None._ This change adds one requirement and modifies one; the prior d4 behavior
was a documented limitation within "MODIFIED Rolling plays a dice animation then
a total modal", not a separate requirement, and is superseded by the updated
wording above.

## Traceability

- Proposal element "d4 `@` notation ignored / hangs (#627)" -> Requirement "ADDED
  The 3D dice engine's d4 forced-face support is restored via a vendored patch"
  (scenarios "Forced d4 lands on its target face", "Forced d4 does not hang at a
  high iteration limit") + design Decisions 1, 2 -> Tasks 1, 2.
- Proposal element "Fix must live in this repo, not depend on upstream merge" ->
  same ADDED Requirement (patch applied at install, fails loud) + design Decision
  2 -> Tasks 2, 5.
- Proposal element "`toDiceBoxNotation` emits `@` for d4 again" -> Requirement
  "MODIFIED Rolling plays a dice animation then a total modal" (forced notation
  for every die size; no `sides === 4` special-case) + design Decision 3 ->
  Task 3.
- Proposal element "d4-specific reconcile-and-skip path removed" -> "MODIFIED
  Rolling…" (no code path special-cases `sides === 4`) + design Decision 4 ->
  Task 4.
- Proposal element "e2e covers a d4 pool settling on its faces" -> "MODIFIED
  Rolling…" scenario "d4 pool animates on its decided faces then reveals the
  modal" + design Decision 7 -> Task 6.
- Proposal element "hang shares the d4 root cause (confirm)" -> ADDED Requirement
  scenario "Forced d4 does not hang at a high iteration limit" + design Decision
  1 -> Task 1.
- Proposal element "patch may fail silently on future installs" -> ADDED
  Requirement scenarios "Missing patch degrades to the instant reveal", "Install-
  time patch failure is visible in CI", "A guard test catches a silently absent
  patch" + design Decisions 4, 5 -> Tasks 4, 5, 7.
- Proposal element "upstream PR also done" -> ADDED Requirement (parallel PR, URL
  recorded) + design Decision 2 -> Task 8.
- Design decision 6 ("`useDiceAnimation` — verify, expect no change") ->
  "MODIFIED Rolling…" (no `sides === 4` special-case) -> Task 4.

## Non-Functional Acceptance Criteria

> NFAC scenarios below express properties not already covered by the functional
> scenarios above.

### Requirement: Performance

#### Scenario: Forced d4 settles within the roll timeout budget

- **Given** the vendored patch is applied and animation is enabled
- **When** a `3d4` pool is animated in headless-Chromium WebGL in CI
- **Then** the engine reports the roll settled before the hook's `ROLL_TIMEOUT` /
  `iterationLimit` bound elapses
- **And** the e2e case completes within the dice-animation spec's existing
  per-test wait budget

### Requirement: Security

See functional scenarios: "Roll outcome is decided before the animation starts",
"Missing patch degrades to the instant reveal, never a hang". The engine patch is
cosmetic only — no new randomness, no network call, and `built.total` /
`built.rolls` / `built.breakdown` / the persisted roll are unchanged on every
path.

### Requirement: Reliability

#### Scenario: Recovery after a mismatched d4 tumble does not disable later animations

- **Given** a d4 pool in the current mounted session was revealed via the
  reconciliation mismatch path (patch absent)
- **When** the user rolls again with animation enabled
- **Then** the 3D dice animation is attempted again for the new roll
- **And** the dice animation status is not latched to `unsupported`

#### Scenario: Operability — CI applies the patch before tests

- **Given** the CI pipeline runs `npm ci`
- **When** the install completes
- **Then** the `postinstall` patch step has run and the marker guard test passes
  in the unit job before the e2e job starts
