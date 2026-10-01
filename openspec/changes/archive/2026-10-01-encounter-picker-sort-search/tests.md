---
name: tests
description: Tests for the encounter-picker-sort-search change
---

# Tests

## Overview

Tests for the `encounter-picker-sort-search` change. Follow strict TDD: write a failing test, make it pass with minimal code, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the requirement; run it and confirm it fails.
2. **Write the simplest code** to pass.
3. **Refactor** while keeping tests green.

## Test Cases

### Task 1 — Helper (`tests/unit/utils/encounterFilter.test.ts`)

- [ ] Sorts names case-insensitively ("Owlbear Den", "goblin Ambush", "Dragon Lair" → Dragon, goblin, Owlbear) — spec: Options sorted alphabetically
- [ ] Does not mutate the input array — spec: Options sorted alphabetically
- [ ] Filters by case-insensitive substring ("gob" → Goblin Ambush only) — spec: Search filters options by name
- [ ] Empty and whitespace-only queries return all encounters — spec: Blank query shows all
- [ ] Retains the selected encounter when it does not match the query — spec: Selected encounter stays visible when filtered out
- [ ] No matches and no selection returns `[]` — spec: No matches shows message
- [ ] 500 encounters filter and sort correctly — spec: NFAC Large list

### Task 2 — Component (`tests/unit/components/CombatSetupView.test.tsx`)

- [ ] Options render in alphabetical order after "No encounter" — spec: Options sorted alphabetically
- [ ] Typing "gob" in "Search encounters" leaves only Goblin Ambush offered — spec: Search filters options by name
- [ ] Clearing / whitespace-only input restores all options — spec: Blank query shows all
- [ ] Selected encounter remains selected and offered after a non-matching search — spec: Selected encounter stays visible when filtered out
- [ ] "No encounters match" appears when nothing matches — spec: No matches shows message
- [ ] Campaign empty state renders no search input; existing empty-state tests still pass — spec: Campaign empty state has no search
- [ ] Search input found by accessible name "Search encounters" — spec: NFAC Labelled input
- [ ] Existing `getByDisplayValue('No encounter')` tests remain green — spec: both routes (regression)

### Task 3 — E2E (`tests/e2e/`)

- [ ] On `/combat`, type into "Search encounters", select the filtered encounter, start combat — spec: Search filters options by name; Both routes show the search
- [ ] On `/campaigns/[id]/combat`, "Search encounters" is visible — spec: Both routes show the search

### Task 4 — Docs

- [ ] Manual check: acceptance criteria in the spec all map to a passing test above — spec: Traceability
