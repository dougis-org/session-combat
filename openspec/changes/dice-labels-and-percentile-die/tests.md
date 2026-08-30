---
name: tests
description: Tests for the dice-labels-and-percentile-die change
---

# Tests

## Overview

Test plan for the `dice-labels-and-percentile-die` change (#573). Strict TDD: write a failing test, write the minimum code to pass, refactor. Every case below maps to a task in `tasks.md` and an acceptance scenario in `specs/**`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the task's requirement; run it and confirm it fails.
2. **Write the simplest code** to pass it.
3. **Refactor** with the test staying green.

## Test Cases

### Task 1 — `rollPercentile()` (`tests/unit/lib/dice.test.ts`)

- [x] 1-a `rollPercentile()` returns `{ tensFace, onesFace, value }` with `tensFace` and `onesFace` integers in 1..10 and `value` an integer in 1..100 → spec `dice-rolling` "Return shape and ranges"
- [x] 1-b faces `[10, 10]` decode to `value === 100` → spec `dice-rolling` "Special-case decode to 100"; `roll-share-ui` "Percentile decode covers the tabletop special case"
- [x] 1-c faces `[10, 9]` decode to `value === 9` → spec `dice-rolling` "'00' tens with non-zero ones decodes to a single digit"; `roll-share-ui` "Percentile decode of a '00' tens with a non-zero ones"
- [x] 1-d faces `[9, 7]` decode to `value === 97`; `[10, 1]` → `1`; `[1, 10]` → `10` → spec `dice-rolling` "Standard decode"
- [x] 1-e over many iterations, every face 1..10 appears for both dice and every value 1..100 is reachable (unbiased, rejection-sampled) → spec `dice-rolling` "Each d10 draw is unbiased"

### Task 2 — shared components (`tests/unit/components/dice/`)

- [x] 2-a `DieGlyph` with `sides=20` renders the `DIE_ICONS[20]` component and the visible text `d20` → spec `dice-iconography` "Standard die glyph renders matching icon and label"
- [x] 2-b `DieGlyph` percentile variant renders exactly two `DiceD10Icon`s and the visible text `d%` → spec `dice-iconography` "Percentile glyph renders two d10 icons and the d% label"
- [x] 2-c `DieGlyph` label is present as rendered text content, not only `title`/`aria-label` → spec `dice-iconography` "Label is visible text, not only an attribute"
- [x] 2-d `DIE_ICONS` keys enumerate to exactly `[4,6,8,10,12,20]` (no `100`) → spec `dice-iconography` "Lookup still covers exactly the six die sizes"
- [x] 2-e `DiePoolButton` renders controls named `Remove d{sides}` / `Add d{sides}`, shows `DieGlyph` + `×{count}`, fires `onAdd`/`onRemove` → spec `roll-share-ui` "Adding a die increments its staged count", "Removing a die decrements its staged count"
- [x] 2-f `DiePoolButton` add control is disabled at `MAX_PER_DIE` and when `disabled` prop is set; remove does not go below 0 → spec `roll-share-ui` "Staged count cannot go below zero"
- [x] 2-g `DiePoolButton` renders no `title` attribute → spec `roll-share-ui` "Die-size controls carry no title tooltip"
- [x] 2-h `DiePoolButton` shows a persistent visible `d{sides}` label → spec `roll-share-ui` "Each die-size control shows a persistent visible label"
- [x] 2-i `PercentileButton` renders one control named `/percentile|d%/i` with the `d%` glyph, no count badge, no remove control → spec `roll-share-ui` "Percentile control renders with the d% glyph and no count"
- [x] 2-j `PercentileButton` fires `onRoll` once per click and is inert when `disabled` → spec `roll-share-ui` "Activating the percentile control commits one roll"

### Task 3 — `buildPercentileRoll()` (`tests/unit/lib/dice/useDicePoolState.test.ts`)

- [x] 3-a `buildPercentileRoll()` returns `{ formula: 'd%', rolls: [v], total: v }` with a single `v` in 1..100 equal to `total` → spec `dice-pool-shared-state` "buildPercentileRoll produces a decoded percentile result independent of the pool"
- [x] 3-b result is unchanged by staged pool contents and modifier value; no HTTP request; pool/modifier unmutated → same scenario
- [x] 3-c `buildRoll()` behavior for staged pools is unchanged (regression) → spec `dice-pool-shared-state` "buildRoll produces no network request"

### Task 4 — chat-dock panel

- [x] 4-a `DicePoolPanel`: all six die controls render a visible `d{sides}` label → spec `roll-share-ui` "Each die-size control shows a persistent visible label"
- [x] 4-b `DicePoolPanel`: no die control has a `title` attribute → spec `roll-share-ui` "Die-size controls carry no title tooltip"
- [x] 4-c `DicePoolPanel`: the percentile control renders inline as the last item of the die row and invokes `onRollPercentile` on click → spec `roll-share-ui` "Percentile control renders with the d% glyph and no count"
- [x] 4-d `useCampaignDice.handlePercentileRoll()` calls `submitRoll` exactly once with `formula: 'd%'`, one-element `rolls` in 1..100, matching `total`, current `visibility` → spec `roll-share-ui` "Activating the percentile control commits one roll"
- [x] 4-e `handlePercentileRoll()` sets then clears `isRolling`; maps `'conflict'` → "No active session" and failure → "Roll failed, try again" in `rollError`; leaves the staged pool untouched → spec `roll-share-ui` "Activating the percentile control commits one roll"
- [x] 4-f percentile control is disabled when `activeSessionId` is null, on the same terms as the pool "Roll" control → spec `roll-share-ui` "Percentile control is unavailable without an active session"

### Task 5 — global dice fab

- [x] 5-a `GlobalDiceFab`: each die control shows a visible `d{sides}` label → spec `global-dice-fab` "Each die control shows a persistent visible label"
- [x] 5-b `GlobalDiceFab`: hovering a die button produces no tooltip element (the `hoveredTooltip` die branch and hover-popover `<div>` are gone); the fab trigger tooltip still works → spec `global-dice-fab` REMOVED "Instant tooltips for dice buttons"
- [x] 5-c `GlobalDiceFab`: activating the inline percentile control sets a local `result` with `formula 'd%'` and total in 1..100, no HTTP request → spec `global-dice-fab` "Percentile control produces a local d% result"
- [x] 5-d `GlobalDiceFab`: with presence, "Send to session chat" on a percentile result calls `submitRoll` with `formula: 'd%'`, `rolls: [value]`, `total: value`, current visibility; `sendState` follows the shared result → spec `global-dice-fab` "A local percentile result is sendable to session chat on the same terms as a pool roll"
- [x] 5-e `GlobalDiceFab`: staged-pool "Roll" control still disabled on empty pool; percentile control unaffected by pool count → spec `global-dice-fab` "Empty pool cannot be rolled"

### Task 6 — feed rendering (`tests/unit/components/CampaignChat/`)

- [x] 6-a `RollFeedItem` renders `{ formula: 'd%', rolls: [97], total: 97 }` showing `d%`, `[97]`, `97` with standard roll-item treatment → spec `roll-share-ui` "Percentile roll feed item"
- [x] 6-b `RollFeedItem` renders `{ formula: 'd%', rolls: [100], total: 100 }` showing `d%`, `[100]`, `100` → spec `roll-share-ui` "Percentile roll feed item for the 100 result"
- [x] 6-c existing roll-feed-item scenarios (pool formula, `[DM]` marker, visual distinction) still pass (regression)

### Task 7 — regression + integration

- [x] 7-a updated `GlobalDiceFab` / `CampaignChat` dice-pool suites pass against the new label markup and removed tooltips
- [x] 7-b `tests/integration/campaigns/rolls.integration.test.ts`: a percentile POST (`formula: 'd%'`, `rolls: [v]`, `total: v`, valid `visibility`) returns 201, persists a `CampaignRoll`, and the roll reaches the feed via the SSE stream (not the POST response) → spec `roll-share-ui` "Activating the percentile control commits one roll"; project memory `n115`
- [x] 7-c full `npm run test:unit` and `npm run test:integration` green; `npm run typecheck`, `npm run lint`, `npm run build` clean
