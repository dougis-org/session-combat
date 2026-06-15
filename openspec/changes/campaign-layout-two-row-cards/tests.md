---
name: tests
description: Tests for campaign-layout-two-row-cards
---

# Tests

## Overview

All implementation work follows a strict TDD process: write a failing test, write the minimum code to pass it, then refactor. Tests live in `tests/unit/components/CampaignsPage.test.tsx`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code. Run and confirm it fails.
2. **Write code to pass the test** — minimum viable change.
3. **Refactor** — clean up while keeping tests green.

## Test Cases

### Task 2 — Campaign list card layout

- [ ] **FR1 — Status chip in document:** Given a campaign list renders, assert `getByText('Active')` (or relevant status label) is in the document alongside the campaign name heading
- [ ] **FR1 — Status chip not sibling of action buttons:** Assert that the status chip element and a button (e.g. "Edit") are NOT within the same immediate flex container (verify via DOM tree or `closest()` check)
- [ ] **FR2 — All action buttons present:** Assert `getByRole('button', { name: 'Edit' })`, `getByRole('button', { name: 'Delete' })`, and links "Members", "Session Log" are all in the document
- [ ] **FR2 — Action row appears after header in DOM:** Assert that the heading element precedes the Edit button in `document.body.innerHTML` order
- [ ] **FR3 — Title has truncate class:** Assert the campaign name heading element has the CSS class `truncate`
- [ ] **FR3 — Title has min-w-0:** Assert the campaign name heading element (or its wrapper) has the CSS class `min-w-0`
- [ ] **FR4 — Edit opens editor:** Click the Edit button; assert the campaign editor is rendered (e.g. `getByText('Save')` or the form appears)
- [ ] **FR4 — Delete triggers confirm:** Mock `window.confirm`; click Delete; assert `window.confirm` was called

### Task 3 — Active campaigns card layout

- [ ] **FR1 — Status chip present in active card:** Given the active campaigns section renders a campaign with status "active", assert `getAllByText('Active')[0]` is in the document
- [ ] **FR2 — Active campaigns action links present:** Assert link "Members", "Prompt Builder", "Library", "Start Encounter" are all in the document
- [ ] **FR2 — Action links appear after heading in DOM:** Assert the campaign heading text precedes the "Members" link in DOM order
- [ ] **FR4 — Members link has correct href:** Assert the Members link has `href` matching `/campaigns/{id}`

### Task 4 — Test suite health

- [ ] **NFR — No regressions:** Run `npm run test:unit`; assert all pre-existing tests in `CampaignsPage.test.tsx` still pass
- [ ] **NFR — No new packages:** Assert `git diff package.json` shows no changes

## Traceability

| Test case | Spec scenario | Task |
|---|---|---|
| Status chip in document | FR1 — Status chip renders beside campaign name | Task 2 |
| All action buttons present | FR2 — Action row present below header row | Task 2 |
| Action row after header in DOM | FR2 — Action row DOM order | Task 2, 3 |
| Title has truncate class | FR3 — Title truncation class applied | Task 2 |
| Edit opens editor | FR4 — Campaign list action buttons | Task 2 |
| Delete triggers confirm | FR4 — Campaign list delete | Task 2 |
| Active card status chip | FR1 — Status chip in active card | Task 3 |
| Active card action links | FR4 — Active campaigns action links | Task 3 |
| No regressions | NFR — Existing unit tests pass | Task 4 |
