---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-initiative-set-button-layout` change. All work follows strict TDD (fail, pass, refactor). Layout is asserted structurally (jsdom cannot compute pixels); visual alignment is verified in a browser.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the requirement; run it and confirm it fails.
2. **Write the simplest code** to pass.
3. **Refactor** while keeping tests green.

## Test Cases

Target file: `tests/unit/components/InitiativeEntry.test.tsx` (reuse existing render helpers).

- [ ] **T1** (task 2.1; spec "Entry controls sit below mode buttons") — dice mode: the dice input and its Set button share a common ancestor with the "Roll d20" button, appear after the mode-button row (`compareDocumentPosition` FOLLOWING), and are not inside the identity/name block.
- [ ] **T2** (task 2.2; spec "Entry controls sit below mode buttons") — the Advantage/Flat bonus row and entry div are in the same controls-column wrapper as the mode buttons.
- [ ] **T3** (task 2.3; spec "Total mode uses the same placement") — click "Enter Total": total input and Set are in the controls column after the mode-button row.
- [ ] **T4** (task 2.1; spec "Mobile stacks left-aligned") — content container has `grid` and `grid-cols-1`, and the two-column template only via `md:grid-cols-[auto_1fr]`.
- [ ] **T5** (task 2.3) — with `combatant.initiativeRoll` set, the result readout renders in the controls column below the buttons.
- [ ] **T6** (tasks 2.4, 3.1; spec "Existing behavior preserved") — all existing `InitiativeEntry` tests in `tests/unit/components/InitiativeEntry.test.tsx` and `tests/unit/combat/initiativeEntry.test.tsx` pass unmodified.
- [ ] **T7** (task 3.2) — manual/Playwright visual check at desktop and mobile widths: Set button fully visible and left edge aligned with "Roll d20".
