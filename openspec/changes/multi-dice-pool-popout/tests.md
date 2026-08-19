---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `multi-dice-pool-popout` change. All work follows a strict TDD (Test-Driven Development) process: write a failing test for each scenario below before implementing the corresponding behavior in `tasks.md`, then implement the simplest code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 2 — `lib/utils/dice.ts`: `rollDicePool` (`tests/unit/lib/dice.test.ts`)

- [ ] Single-group pool: `rollDicePool([{ sides: 6, count: 2 }])` returns an array of exactly 2 entries, each `{ sides: 6, value }` with `value` in `1..6` — maps to `dice-rolling` spec scenario "Single-group pool returns tagged results"
- [ ] Mixed-group pool: `rollDicePool([{ sides: 6, count: 2 }, { sides: 8, count: 2 }])` returns 4 entries, 2 tagged `sides: 6` (value `1..6`), 2 tagged `sides: 8` (value `1..8`), in group order — maps to "Mixed-group pool returns results tagged by their own group's sides"
- [ ] Empty groups: `rollDicePool([])` returns `[]` without error — maps to "Empty group list returns an empty array"
- [ ] Unsupported die size in any group (e.g. `sides: 7`) rejects the whole call, no dice rolled from either group — maps to "Unsupported die size in any group is rejected"
- [ ] Invalid count (e.g. `count: 0`) in any group rejects the whole call — maps to "Invalid count in any group is rejected"
- [ ] Statistical/rejection-sampling smoke check: large-sample roll of one group produces values across the full `1..sides` range with no out-of-range values — maps to "Each die within a pool uses unbiased secure randomness"
- [ ] Regression: existing `rollDie` test suite passes unmodified — confirms `rollDie`'s contract is untouched (design Decision 1)

### Task 4 — `DicePoolPortal` overlay-root component (`tests/unit/components/CampaignChat/` or a new colocated test file)

- [ ] Portal creates (or reuses) a single `<div id="dice-pool-overlay-root">` under `document.body` — maps to `roll-share-ui` spec scenario "Pop-out DOM node is not a descendant of the chat dock drawer"
- [ ] Rendering the portal wrapper in a simulated server (non-browser/no-`document`) environment does not throw and does not attempt `document` access — maps to NFAC "No `document` access during server render for the dice pop-out"
- [ ] Portal content position updates on a simulated window resize/scroll event — supports design Decision 4's fixed-position recompute behavior

### Task 5 — Trigger + staging pool component (`tests/unit/components/CampaignChat/`)

- [ ] Trigger button with accessible name `/roll|dice/i` is visible and enabled when `activeSessionId` is a non-null string — maps to "Trigger renders and is enabled when a session is active"
- [ ] Trigger button is disabled when `activeSessionId` is null; an already-open pop-out closes when `activeSessionId` transitions to null — maps to "Trigger is disabled when no active session"
- [ ] Clicking the trigger opens the pop-out (pop-out content becomes present in the document) — maps to "Clicking the trigger opens the pop-out"
- [ ] Clicking the trigger again closes the pop-out (pop-out content removed from the document) — maps to "Clicking the trigger again closes the pop-out"
- [ ] Clicking outside the pop-out and trigger closes the pop-out — maps to "Pop-out closes on outside click"
- [ ] Pressing Escape while the pop-out is open closes it — maps to "Pop-out closes on Escape"
- [ ] No permanently-visible d4/d6/d8/d10/d12/d20 buttons exist in the chat dock body outside the closed-by-default pop-out — maps to "No always-visible die buttons remain in the chat dock body"
- [ ] Pop-out's DOM node renders under the overlay root, not nested inside the chat dock's `role="complementary"` element, even when the chat dock drawer has a constrained height/overflow style applied in the test harness — maps to "Pop-out is not clipped by a constrained-height ancestor"
- [ ] Adding a d6 twice and a d8 twice sets staged counts to `{6: 2, 8: 2}` with all other sizes at 0, and issues zero network requests — maps to "Adding a die increments its staged count"
- [ ] Removing one d6 from a staged count of 2 decrements it to 1 — maps to "Removing a die decrements its staged count"
- [ ] Attempting to remove a die from a staged count of 0 leaves it at 0 with no error — maps to "Staged count cannot go below zero"
- [ ] Setting the modifier to -2 with an empty pool updates only the modifier, no die counts change — maps to "Modifier is editable independent of staged dice"
- [ ] Pop-out first render shows "Group" selected in the visibility selector — maps to "Visibility selector defaults to group, now inside the pop-out"

### Task 6 — Commit ("Roll") handler (`tests/unit/components/CampaignChat/`)

- [ ] Committing a pool of 2 staged d6 + 2 staged d8 + modifier 3 issues exactly one POST to `/api/campaigns/[id]/rolls` with `formula: "2d6+2d8+3"`, `rolls` containing exactly 4 values each within its own die's range, `total` equal to the sum plus 3, and `visibility` matching the current selection — maps to "Commit posts one combined formula, rolls, and total"
- [ ] Committing 1 staged d20 with modifier 0/empty sends `formula: "1d20"` (no `+0` suffix) — maps to "Commit with zero modifier omits the modifier from formula"
- [ ] Adding a single d20 to the pool issues no POST; only clicking "Roll" afterward issues exactly one POST — maps to "Commit with a single staged die still requires explicit commit"
- [ ] "Roll" control is disabled when the pool has zero staged dice of any size — maps to "Roll button is disabled when the pool is empty"
- [ ] "Roll" control and all pool add/remove controls are disabled while a commit POST is pending, re-enabled after it resolves/rejects — maps to "Roll button is disabled while a commit is in flight"
- [ ] On a `201` response, the staged pool resets to empty and modifier resets to 0, and the returned roll is passed through to the feed exactly as `RollFeedItem` renders today — maps to "Successful commit clears the staged pool"
- [ ] On a `409` response, an inline "No active session" error is shown, no roll is added to the feed, and staged pool/modifier are unchanged — maps to "409 response (no active session race) shows inline error and preserves the staged pool"
- [ ] Selecting "DM-only" in the visibility selector before commit sends `visibility: { scope: "dm-only" }` — maps to "DM-only visibility sends correct scope"
- [ ] Regression: existing `RollFeedItem` rendering tests pass unmodified (flat `formula → [rolls] = total` breakdown) — confirms proposal Non-Goal (no `RollFeedItem` changes) is respected
- [ ] Regression: existing `tests/unit/api/campaigns/[id]/rolls.route.test.ts` passes unmodified — confirms zero API/type changes

### Task 8 — Manual/visual verification (not automated; tracked as a checklist item, not a test file)

- [ ] Desktop-width viewport: pop-out renders fully visible above-right of the trigger, not clipped by the chat dock, stacks above other fixed UI (chat dock pill/drawer)
- [ ] Narrow/mobile-width viewport: same checks, confirming no overflow off-screen

## Traceability Summary

Every `dice-rolling` and `roll-share-ui` delta-spec scenario listed in `openspec/changes/multi-dice-pool-popout/specs/**/spec.md` has at least one corresponding test case above. NFAC scenarios ("No `document` access during server render", "Duplicate commit clicks do not double-post" (covered by the in-flight-disabled test), "no distinct security scenario") are covered by the Task 4 and Task 6 test groups respectively.
