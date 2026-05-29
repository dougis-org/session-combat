---
name: tests
description: Tests for the RTL migration of AlignmentSelect, NavBar, and CreatureStatBlock
---

# Tests

## Overview

This document outlines the test cases for the `rtl-migration-issue-260` change. The work is a test migration — the "implementation" is the migrated test file itself, so the TDD cycle is: write the RTL test → run it (confirm it passes) → refactor if needed.

## Testing Steps

For each task:

1. **Write the RTL test file:** Replace the file with the RTL version. This is the test itself.
2. **Run the test and confirm it passes:** `npx jest <file> --no-coverage`. All cases must pass.
3. **Refactor if needed:** Clean up any duplication or style issues before committing.

## Test Cases

### Task 1 — AlignmentSelect.test.tsx

- [x] `renders a label with text "Alignment"` — `screen.getByText('Alignment')` is in the document
- [x] `renders a select with aria-label "Alignment"` — `screen.getByRole('combobox', { name: 'Alignment' })` is in the document
- [x] `renders exactly 10 options (1 placeholder + 9 standard alignments) by default` — `screen.getAllByRole('option').length === 10`
- [x] `renders all VALID_ALIGNMENTS + placeholder when showExtendedAlignments is true` — option count equals `VALID_ALIGNMENTS.length + 1`
- [x] `placeholder option has value "" and text "Select Alignment"` — `screen.getByRole('option', { name: 'Select Alignment' }).value === ''`
- [x] `each of the 9 standard alignment options has the correct value` — all standard alignments found via `getByRole('option', { name: alignment })` with `.value === alignment`
- [x] `controlled value: select shows the provided value as selected` — `select.value === 'Lawful Good'`
- [x] `calls onChange with the selected value when user changes the select` — `onChange` called with `'Chaotic Evil'` after `userEvent.selectOptions`
- [x] `select is disabled when disabled prop is true` — `expect(combobox).toBeDisabled()`
- [x] `select is not disabled when disabled prop is false` — `expect(combobox).not.toBeDisabled()`

Verification command: `npx jest tests/unit/components/AlignmentSelect.test.tsx --no-coverage`
Expected: 10 tests pass

### Task 2 — NavBar.test.tsx

- [x] `renders all navigation links` — all 6 links (Campaigns, Encounters, Parties, Characters, Monsters, Combat) found via `getByRole('link', { name: ... })` with correct `href` attributes
- [x] `does not show logout button when not authenticated` — `queryByTestId('logout-button')` not in document
- [x] `does not show logout button while loading` — `queryByTestId('logout-button')` not in document when `loading: true`
- [x] `shows logout button when authenticated and not loading` — `getByTestId('logout-button')` in document
- [x] `calls logout when logout button clicked` — mock `logout` called once after `userEvent.click`

Verification command: `npx jest tests/unit/components/NavBar.test.tsx --no-coverage`
Expected: 5 tests pass

### Task 3 — CreatureStatBlock.test.tsx

- [x] `renders AC value under AC label` — `screen.getByText('AC')` and `screen.getByText('16')` in document
- [x] `renders HP/maxHp values under HP label` — `screen.getByText('HP')` and `screen.getByText('30/30')` in document
- [x] `renders acNote when provided` — `screen.getByText('(chain mail)')` in document (exact parenthesized string)
- [x] `renders without acNote when omitted` — `screen.queryByText(/^\(.*\)$/)` not in document
- [x] `renders ability scores in full mode` — `screen.getByText('STR')` and `screen.getByText('DEX')` in document
- [x] `hides ability scores in compact mode` — `screen.queryByText('STR')` and `screen.queryByText('DEX')` not in document

Verification command: `npx jest tests/unit/components/CreatureStatBlock.test.tsx --no-coverage`
Expected: 6 tests pass

### Full suite verification

- [x] `npm run test:unit` — all suites pass with no regressions
