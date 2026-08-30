## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

_(No purely new requirements in this capability; see MODIFIED below.)_

## MODIFIED Requirements

### Requirement: Shared dice-pool selection state usable by any trigger UI

The system SHALL provide a single `lib/dice/useDicePoolState.ts` module exposing
pool selection state (staged count per die size, shared modifier, `poolTotal`, open/close
state for a panel keyed to a trigger/panel ref pair, a `buildRoll()` function, and a
`buildPercentileRoll()` function), used identically by both the chat-docked dice panel and
`GlobalDiceFab`.

`buildRoll()` SHALL return `{ formula, rolls, total }` computed from the current pool via
the existing `rollDicePool`, `buildPoolFormula`, and `getActiveDiceGroups` utilities, **and
SHALL additionally return** `breakdown: { sides: number; value: number }[]` (one entry per
individual die, preserving the per-die size from `rollDicePool`) and `modifier: number` (the
clamped applied modifier). The `formula`, `rolls`, and `total` fields SHALL be byte-for-byte
identical to today's output.

`buildPercentileRoll()` SHALL delegate to the centralized `rollPercentile()` helper (see
`dice-rolling` capability) and return `{ formula: "d%", rolls: [value], total: value }`
where `value` is the decoded percentile result (1..100), **and SHALL additionally return**
`percentileFaces: [tensFace, onesFace]` (the two physical d10 faces from `rollPercentile()`).
It SHALL NOT read the staged pool or the shared modifier, and the persisted/submitted shape
SHALL remain the single decoded value (see decision n121).

The additional fields SHALL be additive only: consumers that read `formula` / `rolls` /
`total`, and the roll-submission payload (`{formula, rolls, total, visibility}`), SHALL be
unaffected.

#### Scenario: Built rolls carry a per-die breakdown without changing the submission payload

- **Given** a staged pool of `2d20+1d6` with modifier `+3`
- **When** `buildRoll()` is called
- **Then** it returns `formula`, `rolls`, and `total` exactly as before
- **And** it also returns `breakdown` with 3 entries — two `{ sides: 20, value }` and one
  `{ sides: 6, value }` — whose `value`s sum with `modifier` (`3`) to equal `total`
- **And** it also returns `modifier: 3`
- **And** when this roll is submitted, the POST body to `/api/campaigns/[id]/rolls` contains
  only `{formula, rolls, total, visibility}` — no `breakdown` or `modifier` field

#### Scenario: Built percentile rolls carry the two physical d10 faces

- **Given** any staged pool contents and any modifier
- **When** `buildPercentileRoll()` is called
- **Then** it returns `{ formula: "d%", rolls: [value], total: value }` with `value` in
  1..100 as before
- **And** it also returns `percentileFaces: [tensFace, onesFace]`, each in 1..10, which
  decode (tens `% 10` * 10 + ones `% 10`, with `0` → `100`) to `value`
- **And** no HTTP request is issued and the staged pool and modifier are unchanged

#### Scenario: buildRoll still produces no network request

- **Given** a non-empty staged pool
- **When** `buildRoll()` is called
- **Then** it computes its result purely client-side via `rollDicePool`, with no HTTP
  request issued

#### Scenario: Both consumers observe identical pool-selection behavior

- **Given** the chat-docked dice panel and `GlobalDiceFab`'s modal both use
  `useDicePoolState`
- **When** a die is added, removed, or the modifier is edited in either surface
- **Then** clamping to `MAX_PER_DIE`, modifier clamping to `MAX_MODIFIER`, `poolTotal`, and
  the built-roll shape (including the new `breakdown` / `modifier` / `percentileFaces`
  fields) behave identically in both surfaces

## REMOVED Requirements

_(None.)_

## Traceability

- Proposal element (additive `BuiltRoll` data seam) -> Requirement: MODIFIED Shared
  dice-pool selection state usable by any trigger UI
- Design decision 1 (additive seam on `BuiltRoll`) -> Requirement: MODIFIED Shared
  dice-pool selection state ...
- Design decision 6 (percentile animates two d10s) -> Scenario: Built percentile rolls
  carry the two physical d10 faces
- Requirement: MODIFIED Shared dice-pool selection state ... -> Task(s): widen `BuiltRoll`,
  update `buildRoll` / `buildPercentileRoll`, update `BuiltRoll` literals in existing tests

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenario "Built rolls carry a per-die breakdown without changing the
submission payload" — it asserts the roll-submission POST body is unchanged. No distinct
non-functional security scenario is required.

### Requirement: Reliability

See the `global-dice-fab` spec delta, NFAC Reliability scenario "Roll result survives an
animation failure" — the built-roll values are always available to the instant path. No
distinct scenario is required here.
