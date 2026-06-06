---
name: tests
description: Tests for rtl-migration-campaign-editor
---

# Tests

## Overview

This migration is a test-file-only change: the deliverable IS the test file. The TDD workflow here is inverted — the existing 25 test cases are the specification. Each migration step below involves:

1. **Red** — Confirm the test fails (or errors) after removing the legacy pattern
2. **Green** — Apply the RTL equivalent; confirm the test passes
3. **Refactor** — Clean up any duplication before moving to the next block

Run `npm test -- --testPathPattern=CampaignEditor` after each step.

## Test Cases

### Task 1 — Imports and boilerplate removal

- [ ] After removing `createReactRoot` import, `npm test -- --testPathPattern=CampaignEditor` fails with a compile/import error (red)
- [ ] After adding `render`/`screen` imports, the file compiles (green)
- [ ] No `container` or `root` variable references remain in the file (refactor verification)
  - Spec: REMOVED createReactRoot / unmountReactRoot usage

### Task 2 — `renderEditor` helper

- [ ] `renderEditor()` with no arguments renders `<CampaignEditor>` with `BASE_CAMPAIGN` defaults without throwing
- [ ] `renderEditor({ campaign: { ...BASE_CAMPAIGN, name: '' } })` renders with empty name (canSave=false path)
  - Spec: ADDED RTL render pattern

### Task 3 — `openChapters` helper

- [ ] When called on an empty-chapters campaign (accordion collapsed), `openChapters()` expands the section so `screen.queryByText('+ Add Chapter')` returns a non-null element
- [ ] When called on a campaign with existing chapters (accordion already expanded), `openChapters()` does not double-click and the section remains expanded
  - Spec: ADDED openChapters helper

### Task 4 — `rendering` describe block (7 tests)

- [ ] `shows "Create Campaign" title when isNew` — `screen.getByRole('heading', { level: 2 })` returns element with text `Create Campaign`
- [ ] `shows "Edit Campaign" title when not isNew` — heading text is `Edit Campaign`
- [ ] `populates name input from campaign` — `screen.getByLabelText('Campaign Name *')` has value `'Test Campaign'`
- [ ] `populates moduleName input from campaign` — `screen.getByLabelText('Module / Adventure')` has value `'LMoP'`
- [ ] `renders status dropdown with current value selected` — `screen.getByTestId('status-select')` has value `'on-hold'`
- [ ] `renders notes textarea with current value` — `screen.getByTestId('notes-textarea')` has value `'Party at level 5'`
- [ ] `notes textarea has maxLength of 10000` — `(screen.getByTestId('notes-textarea') as HTMLTextAreaElement).maxLength === 10000`
- [ ] `renders character counter showing length/10000` — `screen.getByText('5/10000')` is in the document
  - Spec: ADDED Accessible button queries; ADDED Label-based input queries; ADDED testId-based queries

### Task 5 — `validation` describe block (2 tests)

- [ ] `save button is disabled when name is empty` — `expect(screen.getByRole('button', { name: 'Save Campaign' })).toBeDisabled()`
- [ ] `save button is enabled when name has content` — `expect(...).not.toBeDisabled()`
  - Spec: ADDED Accessible button queries

### Task 6 — `saving` describe block (4 tests)

- [ ] `calls onSave with trimmed name` — `user.click` triggers `onSave`; `mock.calls[0][0].name === 'Test Campaign'`
- [ ] `calls onSave with trimmed moduleName` — `mock.calls[0][0].moduleName === 'DH'`
- [ ] `calls onSave with updated status when dropdown changes` — `user.selectOptions` then save; `mock.calls[0][0].status === 'completed'`
- [ ] `calls onSave with on-hold status when dropdown changes to on-hold` — status `'on-hold'` propagated
  - Spec: ADDED userEvent.setup() interaction pattern

### Task 7 — `cancel` describe block (1 test)

- [ ] `calls onCancel when Cancel button clicked` — `user.click(screen.getByRole('button', { name: 'Cancel' }))` triggers `onCancel` once
  - Spec: ADDED userEvent.setup() interaction pattern

### Task 8 — `legacy fields removed` describe block (2 tests)

- [ ] `does not render currentChapter input` — `screen.queryByText(/Current Chapter/)` returns `null`
- [ ] `does not render currentChapterOrder input` — `screen.queryByText(/Chapter Order/)` returns `null`
  - Spec: REMOVED createReactRoot / container usage

### Task 9 — `chapters display` describe block (2 tests)

- [ ] `renders chapter list when chapters present` — `screen.getByDisplayValue('Arrival')`, `screen.getByDisplayValue('The Inn')`, `screen.getByDisplayValue('The Dungeon')` all found in expanded section
- [ ] `save with no chapters calls onSave with chapters: []` — `user.click` save; `mock.calls[0][0].chapters` deep-equals `[]`
  - Spec: ADDED Chapter display assertion uses input values

### Task 10 — `chapters editing` describe block (6 tests)

- [ ] `toggles chapters editing section when accordion button is clicked` — accordion expands/collapses via `user.click(screen.getByRole('button', { name: /chapters/i }))`
- [ ] `adds a new chapter row when "+ Add Chapter" is clicked` — `user.click(screen.getByText('+ Add Chapter'))`; `screen.getAllByTestId('chapter-title-input')` has length 1
- [ ] `removes a chapter, shifts subsequent ones, and clears active chapter if deleted` — `user.click(screen.getByTestId('remove-chapter-1'))`; remaining inputs correct; `savedCampaign.currentChapterId` undefined
- [ ] `reorders chapters with move buttons and updates order index` — move-up/down via testId buttons; saved chapters in correct order
- [ ] `updates currentChapterId when a chapter is selected in active chapter select` — `user.selectOptions(screen.getByTestId('current-chapter-select'), 'ch-2')`; saved `currentChapterId === 'ch-2'`
- [ ] `updates chapter title correctly when typing in the input field` — `user.clear` + `user.type`; `expect(input).toHaveValue('New Arrival')`
- [ ] `sets currentChapterId to undefined when active chapter is removed` — remove active chapter; saved `currentChapterId` undefined
  - Spec: ADDED openChapters helper; ADDED testId-based queries; ADDED userEvent.setup() pattern

### Task 11 — Remove unused helpers

- [ ] `grep 'findButton\|getInput\|function render' tests/unit/components/CampaignEditor.test.tsx` returns no output
- [ ] Full suite of 25 tests still passes after deletion

### Task 12 — No legacy imports remain

- [ ] `grep 'reactRoot\|createReactRoot\|unmountReactRoot' tests/unit/components/CampaignEditor.test.tsx` returns no output
- [ ] `grep 'userEvent\.[a-z]' tests/unit/components/CampaignEditor.test.tsx | grep -v setup` returns no output (no static API calls)
  - Spec: REMOVED createReactRoot / unmountReactRoot usage; ADDED userEvent.setup() pattern
