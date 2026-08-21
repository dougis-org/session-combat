---
name: tests
description: Tests for the dice-panel-scroll-fixes change
---

# Tests

## Overview

This document outlines the tests for the `dice-panel-scroll-fixes` change. All work follows a strict
TDD process: write/adjust a failing test, implement the minimal change to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** capture the task's requirement as a test before changing implementation code.
2. **Write code to pass the test:** make the smallest change that satisfies it.
3. **Refactor:** clean up while keeping the test green.

## Test Cases

All cases live in `tests/unit/components/CampaignChat/CampaignChat.dicePool.test.tsx` unless noted.

### Icon sizes (tasks 1.1–1.3 / spec: MODIFIED Dice pop-out trigger, MODIFIED Dice staging pool)

- [x] Trigger renders the vendored d20 icon (not literal `d20` text) — `trigger displays the vendored d20 icon, not the literal text d20`
- [x] Each per-die add control renders the icon matching its own die size — `each die-size add control renders the icon matching its own die size`

### Tooltips (tasks 2.1–2.4 / spec: MODIFIED Dice pop-out trigger, MODIFIED Dice staging pool)

- [x] Trigger button's `title` equals "Dice Rolls for main screen pop out" — `trigger button exposes a tooltip via its title attribute`
- [x] Each per-die button's `title` equals its die label (`d4`…`d20`) — `each per-die add control exposes a tooltip matching its die size`

### Dice panel content-driven height (tasks 3.1–3.4 / spec: MODIFIED Dice panel renders as an in-flow flex sibling)

- [x] Panel height is content-driven and does not track a large custom drawer height — `dice panel height is content-driven, not tied to a large custom drawer height`
- [x] Panel remains a DOM sibling of the drawer, positioned to its left, absent from the DOM when closed — pre-existing coverage retained: `dice panel is a DOM sibling of the drawer...`, `dice panel appears before the drawer in DOM order...`, `dice panel is absent from the DOM when closed...`

### Auto-scroll on any dice roll (tasks 4.1–4.6 / spec: MODIFIED Feed auto-scrolls on a new dice roll, for any user)

- [x] Committing a roll (POST-response path) scrolls the feed — `committing a roll scrolls the feed to reveal it`
- [x] A roll from another player arriving via SSE also scrolls the feed — `a roll from another player arriving via SSE also triggers auto-scroll`
- [x] A duplicate roll id racing between the SSE echo and the POST response scrolls exactly once — `a duplicate roll id racing between the SSE echo and the POST response still scrolls exactly once`
- [x] A new chat message does not trigger auto-scroll — `a new chat message does not trigger auto-scroll`
- [x] Auto-scroll does not reorder the feed — `auto-scroll does not reorder the feed — the new roll stays last`

### Regression coverage (unchanged behavior, re-verified)

- [x] Existing dice-pool commit/error/visibility test suite still passes unmodified (`CampaignChat — dice pool commit` describe block)
- [x] `tsc --noEmit` passes with no errors

## Validation Evidence

- `npx jest tests/unit/components/CampaignChat` — 115/115 passing (run 2026-08-20)
- `npx tsc --noEmit -p tsconfig.json` — no errors (run 2026-08-20)
- Manual browser smoke test — **not yet performed**, tracked in `tasks.md` Validation section
