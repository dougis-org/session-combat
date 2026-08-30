# Design — dice labels + percentile die (#573)

## Context

Two dice panels render an identical-in-intent die-control row that has drifted:

| | `DicePoolPanel.tsx` (chat dock) | `GlobalDiceFab.tsx` (corner fab) |
|---|---|---|
| tooltip | native `title="d{sides}"` | `hoveredTooltip` state + custom `<div>` popover |
| markup | flat | wrapped in `relative flex` for the popover |
| roll trigger | `onRoll` prop → immediate submit | local `handleRoll` → show result, then "Send to chat" |

Making the label permanently visible (#573 ask 1) removes the reason the tooltip exists, so this is the moment to unify the markup rather than add a third divergent copy.

Roll computation stays in the dice UI; persistence/feed/scroll stay in campaign chat (`n060`). All dice generation goes through the centralized rejection-sampled secure generator (`n051`, `n065`). The rolls API remains the sole authz/validation boundary (`n072`); this change adds no new trust surface.

## Decisions

### D1 — Percentile is a standalone roll, not a poolable die

The staged-pool model is "sum every face value + modifier" (`roll-share-ui` "Commit rolls the entire staged pool as one combined roll"). Percentile is a positional decode of two faces with a special case — it does not fit "sum the faces." Rather than special-case the pool reducer, percentile gets its own control:

- no staged count, no `−`, not mixable with staged dice
- does not read the shared modifier
- one roll at a time (clicking produces exactly one result)

This keeps `buildRoll()` and the pool spec untouched.

**Alternative rejected:** treat d100 as a pool die contributing its decoded value to the sum. Rejected — it forces every pool-roll code path (formula builder, `rollDicePool`, the feed breakdown) to understand a die whose "value" is not its face, for a mechanic players almost always roll on its own.

### D2 — Roll as two `rollDie(10)` calls, not one `rollDie(100)`

`SUPPORTED_SIDES` already includes 100, but a single d100 draw cannot be animated as two tumbling d10s. The forthcoming roll-animation work needs two independent physical dice. `rollPercentile()` therefore makes two calls and returns both faces plus the decoded value.

### D3 — Decode rule

```
tensFace, onesFace ∈ 1..10          (two rollDie(10) results)
tensDigit = tensFace % 10           → 0..9   (face 10 → 0, i.e. "00")
onesDigit = onesFace % 10           → 0..9   (face 10 → 0)
value = tensDigit * 10 + onesDigit
if value === 0: value = 100         (the "00" + "0" special case)
```

Checked against #573:
- faces `[10, 10]` → `0*10 + 0 = 0` → **100**  ("a dice roll of 20 in total ... is a value of 100")
- faces `[10, 9]`  → `0*10 + 9 = 9`             ("a value of 19 ... is 9")
- faces `[9, 7]`   → `90 + 7 = 97`
- faces `[10, 1]`  → `1`

### D4 — Persist the decoded value

`rolls: [value]` — a single entry, 1..100 — with `formula: "d%"` and `total: value`. This is what the feed and roll history should show; the raw d10 faces are a roll-time animation detail, not history.

**Trade-off:** the feed breakdown becomes `d% → [97] = 97` (mildly redundant). Storing `[tensFace, onesFace]` instead would give `d% → [90, 7] = 97` but changes what "the roll result" means in history and complicates the special-100 case (`[10,10]` reads as raw 20). Decoded value chosen for a clean, unambiguous history record. `rollPercentile()` still returns the faces for the animation layer.

### D5 — `d%` visual: two d10 icons + `d%` label

No d100 icon is vendored and none is added (avoids more CC-BY attribution bookkeeping). `DieGlyph` with `sides='%'` renders two `DiceD10Icon`s side by side under the label `d%`. `DIE_ICONS` keys stay exactly `4,6,8,10,12,20` (`dice-iconography` spec unchanged on that point).

### D6 — Component split

```
DieGlyph({ sides })          presentational only — icon(s) + visible label
DiePoolButton({ ... })       [−] [ button: DieGlyph + ×count ]   add/remove
PercentileButton({ onRoll, disabled })   [ button: DieGlyph(%) ] one roll
```

`DieGlyph` is the single home of the label text. `DiePoolButton` / `PercentileButton` hold no roll logic — the parent passes handlers (`DicePoolPanel` → submit via `useCampaignDice`; `GlobalDiceFab` → local result + send-to-chat). This preserves the existing UI/chat split.

### D7 — Panel wiring

- `useDicePoolState` gains `buildPercentileRoll(): BuiltRoll` → `{ formula: PERCENTILE_FORMULA, rolls: [value], total: value }`.
- `useCampaignDice` gains `handlePercentileRoll()` mirroring `handleDiceRoll()` (set rolling, `submitRoll`, error handling) — no pool reset needed since percentile doesn't touch the pool.
- `GlobalDiceFab` gains a percentile branch in `handleRoll` equivalent (or a dedicated `handlePercentileRoll`) that sets `result` from `dp.buildPercentileRoll()`; "Send to session chat" then works unchanged.

## Testability

- `rollPercentile()` decode is pure and table-tested against the issue's worked examples (D3).
- `DieGlyph` / `DiePoolButton` / `PercentileButton` are presentational — rendered in isolation with RTL, no network or timers.
- `buildPercentileRoll()` is deterministic in shape (mock `rollPercentile`) and asserted independent of pool/modifier state.
- The submit path is covered at the hook level (`useCampaignDice` / `GlobalDiceFab`) with a mocked `useRollSubmission`, and end-to-end through `tests/integration/campaigns/rolls.integration.test.ts`.
- Existing dice-panel suites are updated for the label markup and removed tooltips — a net assertion change, not new surface.

## Risks / rollback

- **Risk:** the shared-component extraction changes DOM structure the existing `GlobalDiceFab` / `CampaignChat` dice suites assert against. *Mitigation:* those suite updates are explicit tasks; the refactor is behavior-preserving for pool rolls.
- **Risk:** `formula: "d%"` is a new formula string in persisted `CampaignRoll` history; any consumer that parses formulas (none known today) would need to tolerate it. *Mitigation:* the feed renders formulas as opaque strings; no parser exists.
- **Rollback:** the change is additive and UI-local. Reverting the PR removes the percentile control, the shared components, and the label change together with no data migration — persisted `d%` rolls remain valid `CampaignRoll` rows and still render (`formula → [rolls] = total`).

## Operational blocking policy

CI failures, security/code-quality findings, and unresolved PR review threads block merge. Resolve each via: fix → commit → local validation → push → re-check, iterating until clean. Never force-merge (`--admin`) and never bypass branch protection (see project memory `feedback_no_admin_merge`, `feedback_no_branch_protection_bypass`).

## Out of scope

- 3D / physics roll animation (`@3d-dice/dice-box`) — deferred, tracked in `lib/components/icons/dice.tsx` header. D2 is the groundwork.
- Server-side recompute/validation of submitted roll results — the rolls API's existing shape checks are unchanged; percentile does not weaken them.
- Adding a plain d100 to the pool builder — explicitly not wanted (D1).

### D8 — `d%` control sits inline with the pool dice

The percentile control renders in the same flex row as the six pool die controls (as the last item), not set apart with a divider or its own row. It is visually a die button like the others (`DieGlyph` shell); its *behavioral* difference — no count, fires immediately — is carried by the absence of the `−`/count affordances, not by separation. Keeps the panel content-driven and compact (`n057`).
