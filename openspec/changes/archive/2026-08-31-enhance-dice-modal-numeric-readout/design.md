## Context

- Relevant architecture:
  - `lib/components/dice/DiceRollOverlay.tsx` renders a body-level portal
    (decision n047) containing the 3D dice canvas and, once the animation
    reports completion / is skipped / times out, a result modal. The modal body
    is `formula` → `<StaticRollResult built={built} />` → total.
  - `StaticRollResult` is a file-local presentational component. It reads
    `built.breakdown: { sides: number; value: number }[]` and, for percentile
    rolls, `built.percentileFaces: [number, number]` — both supplied by
    `buildRoll()` / `buildPercentileRoll()` in
    `lib/dice/useDicePoolState.ts` (contract owned by `dice-pool-shared-state`).
  - `DICE_ANIM_CAP` (currently 15) is imported from
    `lib/dice/toDiceBoxNotation.ts` and used to slice the readout so it matches
    the animated subset.
- Dependencies:
  - `DIE_ICONS`, `DiceD10Icon` from `lib/components/icons/dice.tsx` — imported
    today by `DiceRollOverlay.tsx` **and** by `DieGlyph.tsx` /
    `DiePoolButton.tsx`. Only the `DiceRollOverlay.tsx` import is removed.
  - `DieSides` type from `lib/utils/dice.ts` — used for the (now removed)
    `DIE_ICONS[die.sides as DieSides]` lookup; the type import may no longer be
    needed in this file.
- Interfaces/contracts touched:
  - None. `BuiltRoll` is read unchanged. `data-testid="die-face"` and
    `data-testid="dice-readout-remainder"` are preserved as the stable test /
    tooling hooks. No prop, export, or module boundary changes.

## Goals / Non-Goals

### Goals

- The result modal shows each rolled die as its **numeric value**, dominant,
  with a small `d{sides}` (`d%` for percentile) size tag.
- Exactly one rendering path for every die size, including sizes with no icon.
- Percentile faces use the same chip styling.
- Zero change to roll values, reveal gating, a11y announcement, or the pool /
  fab iconography.

### Non-Goals

- Face-accurate dice artwork, pips, watermark icons.
- Uncapping the readout past `DICE_ANIM_CAP`.
- Touching the animation, engine, reconciliation, or scaling.
- Any server / persistence / RNG change.

## Decisions

### Decision 1: Numeric chip replaces icon-plus-overlay for every die

- Chosen: Render each `breakdown` entry as a single element — the die's `value`
  as the dominant text, a small secondary `d{sides}` label beneath/beside it —
  reusing the existing wrapping flex container (`flex flex-row flex-wrap
  justify-center items-center gap-4 ... max-w-[80vw]`). Keep
  `data-testid="die-face"` on the value element.
- Alternatives considered:
  - (a) Keep the size-silhouette icon as a faint background watermark behind the
    number. Rejected by the requester — icon removed entirely.
  - (b) Pip-render d6, number-render the rest. Rejected by the requester — no
    pips; uniform treatment.
  - (c) Per-face SVG icon sets (6 sizes × up to 20 faces). Rejected — heavy,
    explicitly out of scope of the original dice-roll-enhancements design, and
    unnecessary for "show another instance of the values".
- Rationale: The 3D tumble already provides the physical-dice fantasy; the modal
  readout's job is a fast, unambiguous echo of the decided values. A number with
  a size tag is the minimal faithful representation and removes the misleading
  "generic die face" the issue reports.
- Trade-offs: Loses the at-a-glance die-shape silhouette in the modal; the
  `d{sides}` tag compensates. Slightly less visually rich.

### Decision 2: Collapse the `Icon` / `fallback-die` branches into one path

- Chosen: Delete the `if (!Icon) { ...fallback-die... }` branch. Every die —
  known size or not — renders the same numeric chip. Drop the
  `data-testid="fallback-die"` hook (no longer a distinct case) unless a test
  still needs a name for the "unknown size" case, in which case keep it as a
  modifier class only.
- Alternatives considered: Keep a distinct unknown-size rendering. Rejected —
  the whole point of the new design is size-agnostic; a bordered box for unknown
  sizes would reintroduce a branch for no user benefit.
- Rationale: One path is simpler to test and style and cannot drift.
- Trade-offs: A test asserting `fallback-die` renders for an exotic `sides`
  value must be updated.

### Decision 3: Percentile readout uses the same chips, no `DiceD10Icon`, no `mt-2`

- Chosen: Replace the two `<div class="relative w-16 h-16"><DiceD10Icon/><span
  .../></div>` cells with two numeric chips showing the tens (`00`..`90`) and
  ones (`0`..`9`) strings already computed from `percentileFaces`, each tagged
  `d%`. Remove the `mt-2` vertical nudge that only existed to centre text over
  the icon.
- Alternatives considered: Leave percentile as-is. Rejected — it has the same
  generic-icon problem and should be visually consistent with the pool readout.
- Rationale: Consistency; the `mt-2` hack is obsolete without the icon.
- Trade-offs: None material. The decoded `built.total` (1..100) still shows on
  the total line unchanged.

### Decision 4: Keep `DICE_ANIM_CAP` slice and `+N more` unchanged

- Chosen: `built.breakdown.slice(0, DICE_ANIM_CAP)` and the
  `data-testid="dice-readout-remainder"` `+{remainder} more` note stay exactly
  as they are.
- Alternatives considered: Uncap the readout to list every die ("render ALL
  dice" read literally). Rejected by the requester (2026-08-31) — keep 15 +
  `+N more`.
- Rationale: The readout stays aligned with the animated subset; a 120-die roll
  does not dump 120 numbers into the modal. The total line already always shows
  the full-pool total.
- Trade-offs: For very large pools the readout is a sample, not a full list —
  accepted.

### Decision 5: `DIE_ICONS` / `dice.tsx` stay; only the `DiceRollOverlay` import goes

- Chosen: Leave `lib/components/icons/dice.tsx` and its exports intact; remove
  the now-unused `import { DIE_ICONS, DiceD10Icon } ...` line from
  `DiceRollOverlay.tsx`.
- Alternatives considered: Delete unused per-face-capable icons. Rejected —
  `DieGlyph` / `DiePoolButton` still consume `DIE_ICONS` for the pool controls;
  and `dice-iconography` is its own capability with its own spec.
- Rationale: Minimal blast radius; the iconography capability is unaffected.
- Trade-offs: A lint rule for unused exports (if any) is unaffected because the
  exports are still used by other modules.

## Proposal to Design Mapping

- Proposal element: "Rewrite `StaticRollResult` to a numeric-chip readout"
  - Design decision: Decision 1, Decision 2
  - Validation approach: `DiceRollOverlay.test.tsx` — assert each die's `value`
    text and `d{sides}` tag render; assert no `<svg>` die-face icon inside the
    result dialog; snapshot / DOM check for the single render path.
- Proposal element: "Percentile readout uses the same styling, no `DiceD10Icon`"
  - Design decision: Decision 3
  - Validation approach: unit test with a percentile `built` (`percentileFaces`
    set) — assert two chips with the tens/ones strings and `d%` tags, and no
    `DiceD10Icon` svg.
- Proposal element: "Keep the 15-die cap and `+N more`"
  - Design decision: Decision 4
  - Validation approach: unit test with `breakdown.length` > `DICE_ANIM_CAP` —
    assert exactly `DICE_ANIM_CAP` chips and a
    `data-testid="dice-readout-remainder"` reading `+N more`; total equals the
    full-pool total.
- Proposal element: "`DIE_ICONS` / `dice.tsx` stay in the codebase"
  - Design decision: Decision 5
  - Validation approach: existing `DieGlyph` / `DiePoolButton` tests continue to
    pass unchanged; `dice-iconography` spec untouched.
- Proposal element: "No change to roll values / reveal gating / a11y"
  - Design decision: Goals / Non-Goals; Decision 1 (testids preserved)
  - Validation approach: existing overlay reveal / fallback / focus / `aria-live`
    tests pass unchanged; E2E per-die *value* assertions pass unchanged.

## Functional Requirements Mapping

- Requirement: Result modal per-die readout is numeric-only with a size tag and
  no die-face graphic.
  - Design element: Decision 1, Decision 2
  - Acceptance criteria reference: spec.md → MODIFIED "Rolling plays a dice
    animation then a total modal" → scenarios "Result modal per-die readout
    shows numeric values with a size tag" and "Result modal readout renders no
    die-face graphic".
  - Testability notes: RTL — query `data-testid="die-face"` elements, assert
    text content equals each `breakdown[i].value`; assert
    `container.querySelector('[role="dialog"] svg')` is null (no die icon);
    assert a `d{sides}` string per chip.
- Requirement: Percentile readout uses the same numeric chips.
  - Design element: Decision 3
  - Acceptance criteria reference: spec.md → scenario "Percentile result modal
    readout shows two numeric face chips".
  - Testability notes: render with `percentileFaces: [7, 0]` → chips read `70`
    and `0`; both tagged `d%`; no `DiceD10Icon`.
- Requirement: 15-die display cap and `+N more` retained.
  - Design element: Decision 4
  - Acceptance criteria reference: spec.md → scenario "Large pools still cap the
    readout at 15 with a remainder note".
  - Testability notes: `breakdown` of length 20 → 15 `die-face` chips +
    `dice-readout-remainder` = `+5 more`; total line equals sum of all 20 +
    modifier.
- Requirement: Roll values, reveal gating, and a11y announcement unchanged.
  - Design element: Goals / Non-Goals
  - Acceptance criteria reference: spec.md → scenario "Roll outcome is decided
    before the animation starts" (unchanged) and the base overlay reveal
    scenarios.
  - Testability notes: existing tests for modal gating, fallback timeout, focus,
    and the `sr-only` `aria-live` line must remain green with no edits.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: The readout renders identically on every modal-reveal path
    (animation complete, disabled, unsupported, fallback timeout).
  - Design element: `StaticRollResult` is a pure function of `built`; the reveal
    path only gates *whether* the modal mounts, not its content.
  - Acceptance criteria reference: spec.md NFAC → Reliability → "Readout is
    identical across reveal paths".
  - Testability notes: parametrised unit test rendering the modal via each
    `modalRevealed` trigger (`disableAnimation`, `animationStatus:
    'unsupported'`, `animationSettled`, fallback) and asserting identical chip
    output.
- Requirement category: operability / a11y
  - Requirement: Assistive-tech users still get the spoken result via the
    unchanged `aria-live` region.
  - Design element: The `sr-only role="status" aria-live="polite"` line is not
    touched.
  - Acceptance criteria reference: spec.md NFAC → Operability → "Screen-reader
    announcement is unchanged".
  - Testability notes: existing test asserting the live region text
    `"{formula} rolled {total}"` after the 50ms tick remains green.
- Requirement category: performance
  - Requirement: No added render cost; no new dependency, asset, or network call.
  - Design element: Removes SVG icon components from the modal render (net
    reduction); adds only text nodes.
  - Acceptance criteria reference: spec.md NFAC → Performance → "No new runtime
    cost".
  - Testability notes: `npm run build` bundle check — no new chunk; the modal
    render is strictly lighter (fewer DOM nodes, no `<svg>` paths).

## Risks / Trade-offs

- Risk/trade-off: Hidden test coupling to `DIE_ICONS` / `fallback-die` in the
  result modal.
  - Impact: Red suite.
  - Mitigation: Grep `tests/` for `DIE_ICONS`, `DiceD10Icon`, `die-face`,
    `fallback-die`, `dice-readout-remainder` during Execution; update all.
- Risk/trade-off: Visual cramping for `15d6` or at 375px.
  - Impact: Cosmetic.
  - Mitigation: Reuse existing flex-wrap + `max-w-[80vw]`; designqc / manual
    check at `15d6` and 375px in Validation.
- Risk/trade-off: Loss of die-shape silhouette in the modal.
  - Impact: Slightly less scannable for mixed pools.
  - Mitigation: `d{sides}` tag on every chip; requester-approved.

## Rollback / Mitigation

- Rollback trigger: Post-merge visual or a11y regression in the result modal, or
  a test-fidelity gap discovered after archive.
- Rollback steps: Revert the single commit touching
  `lib/components/dice/DiceRollOverlay.tsx` and its tests; the spec delta revert
  follows in the same PR revert. No data or schema involved.
- Data migration considerations: None — no persisted data, schema, or API
  surface is touched.
- Verification after rollback: `DiceRollOverlay.test.tsx` green on the reverted
  code; manual roll in the fab shows the prior icon-based modal.

## Operational Blocking Policy

- If CI checks fail: diagnose from the CI log, fix on the working branch, re-run
  `npm test` / `npm run build` locally, push; repeat. Do not merge red.
- If security checks fail: this change adds no auth, network, input, or
  dependency surface — a security finding here is almost certainly a false
  positive on unrelated lines; if genuine, remediate before push. Never `verity
  waive` on the agent's own judgement.
- If required reviews are blocked/stale: follow the tasks.md PR loop — poll,
  address every unresolved thread, re-validate, push. If the same finding
  survives three review-fix iterations with no progress, stop and report the
  stall to the user with the remaining findings.
- Escalation path and timeout: after 3 non-progressing review-fix cycles, or if
  CI is red for reasons outside this diff, pause and hand back to the user with
  a summary.

## Open Questions

- None. All ambiguity was resolved with the requester during the explore session
  and the follow-up questions on 2026-08-31 (see proposal → Open Questions).
