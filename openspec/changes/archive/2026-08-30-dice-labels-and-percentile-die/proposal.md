## GitHub Issues

- #573

## Change control

If scope changes during implementation, update `proposal.md`, `design.md`, the affected `specs/**`, `tasks.md`, and `tests.md` **before** writing further code. GitHub issue #573 (and any exploration ticket) is assigned to the current user.

## Why

GitHub issue #573 asks for two things to make dice rolls "simpler to build":

1. **Visible die labels.** Each die control in the pool builder shows only an icon plus a staged count; the `d{sides}` text is hidden inside a hover tooltip (`title` in the chat dock, a custom hover popover in the global fab). Players want the label always visible under the graphic, matching the tooltip text.
2. **Percentile dice.** There is no way to roll d100. Percentile is rolled as **two d10** — one die is the tens value, one is the ones — with the standard tabletop special case: a `00` on the tens die means a single-digit result, **unless** the ones die is also `0`, in which case the result is **100** (not 0). The issue's examples: two `10`s (raw 20) → **100**; a `10` on the tens die and `9` on the ones die (raw "19") → **9**.

The label change is the natural moment to collapse the two hand-rolled, already-drifted copies of the die-control markup into one shared component, and the percentile control reuses that same component. Doing both in one change keeps the shared component's design coherent.

## What Changes

- **Shared die-control component.** Extract the per-die control markup (currently duplicated between `lib/components/dice/DicePoolPanel.tsx` and `lib/components/GlobalDiceFab.tsx`) into shared components under `lib/components/dice/`:
  - `DieGlyph` — presentational: the vendored die icon(s) plus a **visible** `d{sides}` label. For percentile it renders two `DiceD10Icon`s and the label `d%`.
  - `DiePoolButton` — the `−` / add control wrapping `DieGlyph` with the staged-count badge.
  - `PercentileButton` — a single control (no count, no `−`) that fires one percentile roll.
  Both the chat-dock panel and the global fab render `DIE_SIDES.map(DiePoolButton)` plus one `PercentileButton`.
- **Visible labels.** Every pool die control shows its `d{sides}` label under the icon. The now-redundant per-die tooltips are removed: the chat dock's `title` attribute and the global fab's custom `hoveredTooltip` state + hover-popover `<div>` for die buttons. (The fab's *trigger* tooltip is unaffected.)
- **Percentile roll — standalone.** A `PercentileButton` in both dice panels rolls **two independent `rollDie(10)` calls** (two calls, not one `rollDie(100)`, so the forthcoming roll-animation work can animate two physical dice) and decodes them:
  - `tensDigit = tensFace % 10` (0..9), `onesDigit = onesFace % 10` (0..9)
  - `value = tensDigit * 10 + onesDigit`; if `value === 0` then `value = 100`
  - Verified against the issue: faces `[10, 10]` → `0` → `100`; faces `[10, 9]` → `9`.
  - It is *its own thing*: not a poolable die, not mixable with staged dice, does not use the shared modifier, one roll at a time.
  - Persisted via the existing `/api/campaigns/[id]/rolls` contract with `formula: "d%"`, `rolls: [value]` (the **decoded** value, a single 1..100 entry), `total: value`, and the panel's current `visibility` selection. The chat-dock button submits immediately; the global fab shows the result with its "Send to session chat" affordance, exactly like a pool roll.
- **Centralized percentile helper.** `rollPercentile()` in `lib/utils/dice.ts` returns `{ tensFace, onesFace, value }` using the existing rejection-sampled secure generator, so decode logic lives with the other dice utilities and the animation layer can later read the faces without a contract change.
- **Feed rendering.** `RollFeedItem` and the global fab's result box already render `formula → [rolls] = total`; a percentile roll renders as `d% → [97] = 97` (and `d% → [100] = 100` for the special case) with no special-casing. No feed layout change.
- **Roll animation is explicitly out of scope**, noted so it isn't silently dropped. The two-call `rollPercentile()` structure is the groundwork for it.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `roll-share-ui`: The dice staging pool's per-die controls gain a persistent visible `d{sides}` label (the `title` tooltip is removed as redundant). A new standalone percentile (`d%`) control rolls two d10s, decodes them to a 1..100 value, and commits one roll through the unchanged rolls API. Roll feed items render percentile rolls through the existing formula/breakdown/total path.
- `dice-iconography`: A shared `DieGlyph` presentational component pairs each vendored die icon with its visible label; a `d%` variant renders two `DiceD10Icon`s with the label `d%`. `DIE_ICONS` keys are unchanged (no d100 icon is vendored).
- `dice-rolling`: Adds `rollPercentile()` returning `{ tensFace, onesFace, value }`, built on the existing centralized secure generator, encoding the tabletop percentile decode rule.
- `dice-pool-shared-state`: The shared dice-pool state hook exposes `buildPercentileRoll()` alongside `buildRoll()`, producing the `{ formula: "d%", rolls: [value], total: value }` shape for the standalone percentile control.
- `global-dice-fab`: The fab panel renders the shared `DiePoolButton`/`PercentileButton` components; per-die instant-tooltip behavior is replaced by the always-visible label. The percentile result is sendable to session chat on the same terms as a pool roll.

## Impact

- `lib/components/dice/` — new `DieGlyph.tsx`, `DiePoolButton.tsx`, `PercentileButton.tsx`.
- `lib/components/dice/DicePoolPanel.tsx` — die row replaced by shared components; `title` tooltip removed; percentile control added; new `onRollPercentile` prop.
- `lib/components/GlobalDiceFab.tsx` — die row replaced by shared components; per-die `hoveredTooltip` state and hover-popover removed; percentile control + result handling added.
- `lib/dice/useDicePoolState.ts` — add `buildPercentileRoll()`.
- `lib/components/CampaignChat/useCampaignDice.ts` — add a `handlePercentileRoll()` sibling to `handleDiceRoll()` reusing `useRollSubmission`.
- `lib/utils/dice.ts` — add `rollPercentile()` and the `PERCENTILE_FORMULA = "d%"` constant.
- `lib/components/CampaignChat/ChatFeed.tsx` — no logic change expected; verified via tests that `d%` / `[100]` render correctly.
- `/api/campaigns/[id]/rolls` — no change (`formula: "d%"`, `rolls: [1..100]`, `total` all pass the existing validation).
- Tests: `tests/unit/lib/dice.test.ts` (percentile decode incl. the `[10,10] → 100` and `[10,9] → 9` cases, unbiased faces); new `tests/unit/components/dice/` suites for `DieGlyph` / `DiePoolButton` / `PercentileButton`; updates to `GlobalDiceFab` and `CampaignChat` dice-pool suites for the label markup, removed tooltips, and the percentile submit path.
