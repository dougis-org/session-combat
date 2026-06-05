---
name: tests
description: TDD test cases for migrate-campaigneditor-test-to-rtl
---

# Tests

## Overview

This document maps each implementation task to its TDD cycle. Because this change is primarily a test migration (the test file *is* the artifact), the TDD discipline applies to the two component changes (`ui.tsx` and `CampaignEditor.tsx`) — write a failing RTL test first, then implement to make it pass. For the test file itself, each migrated test case should be run after conversion to confirm it is green before moving to the next.

All test commands: `npx jest --testPathPattern CampaignEditor`

---

## Test Cases

### Task 1 — TextInputField auto-id (lib/components/ui.tsx)

These tests are written in the migrated `CampaignEditor.test.tsx` and will initially fail until `ui.tsx` is updated.

- [ ] **TC-1.1** `screen.getByRole('textbox', { name: /campaign name/i })` resolves after `renderEditor()` — fails before auto-id; passes after.
  - Spec: `specs/rtl-migration/spec.md` — "RTL resolves input by accessible name"
  - Task: Execution §1

- [ ] **TC-1.2** `screen.getByRole('textbox', { name: /module \/ adventure/i })` resolves after `renderEditor()` — same cycle.
  - Spec: `specs/rtl-migration/spec.md` — "RTL resolves input by accessible name"
  - Task: Execution §1

- [ ] **TC-1.3** Rendering `TextInputField` with an explicit `id` prop: the `<input>` carries that exact `id`, not the derived one. (Manual DOM inspection via `document.getElementById('my-custom-id')` or attribute assertion.)
  - Spec: `specs/rtl-migration/spec.md` — "Explicit id overrides auto-generation"
  - Task: Execution §1

---

### Task 2 — Component aria-labels (app/campaigns/CampaignEditor.tsx)

These tests are written in the migrated test file and fail until component changes are in place.

- [ ] **TC-2.1** After opening chapters with one chapter titled "Arrival": `screen.getByRole('textbox', { name: /chapter 1 title/i })` resolves.
  - Spec: "Chapter title inputs have accessible names"
  - Task: Execution §2

- [ ] **TC-2.2** After opening chapters with three chapters: `screen.getAllByRole('textbox', { name: /chapter \d+ title/i })` has length 3.
  - Spec: "Chapter title inputs have accessible names"
  - Task: Execution §2

- [ ] **TC-2.3** After opening chapters with a chapter titled "Arrival": `screen.getByRole('button', { name: /remove arrival/i })` resolves.
  - Spec: "Chapter remove button has accessible name"
  - Task: Execution §2

- [ ] **TC-2.4** After adding a new (untitled) chapter: `screen.getByRole('button', { name: /remove chapter 1/i })` resolves.
  - Spec: "Chapter remove button — ordinal fallback"
  - Task: Execution §2

---

### Task 3 — Migrated test cases (tests/unit/components/CampaignEditor.test.tsx)

Each migrated test is its own TDD cycle: convert to RTL syntax → run → confirm green before proceeding. The 26 tests are grouped by describe block.

#### rendering (7 tests)
- [ ] **TC-3.01** "Create Campaign" heading present when `isNew=true`
- [ ] **TC-3.02** "Edit Campaign" heading present when `isNew=false`
- [ ] **TC-3.03** Name input `toHaveValue('Test Campaign')`
- [ ] **TC-3.04** Module input `toHaveValue('LMoP')`
- [ ] **TC-3.05** Status select `toHaveValue('on-hold')` when campaign status is `on-hold`
- [ ] **TC-3.06** Notes textarea `toHaveValue('Party at level 5')`
- [ ] **TC-3.07** Notes textarea has `maxLength` attribute of `10000`
- [ ] **TC-3.08** Character counter shows `5/10000`

#### validation (2 tests)
- [ ] **TC-3.09** Save button is disabled when name is empty
- [ ] **TC-3.10** Save button is enabled when name has content

#### saving (4 tests)
- [ ] **TC-3.11** `onSave` called with trimmed name
- [ ] **TC-3.12** `onSave` called with trimmed moduleName
- [ ] **TC-3.13** `onSave` called with `status: 'completed'` after `userEvent.selectOptions`
- [ ] **TC-3.14** `onSave` called with `status: 'on-hold'` after `userEvent.selectOptions`

#### cancel (1 test)
- [ ] **TC-3.15** `onCancel` called when Cancel button clicked via `userEvent.click`

#### legacy fields removed (2 tests)
- [ ] **TC-3.16** No "Current Chapter" label in DOM (when accordion closed, chapters empty)
- [ ] **TC-3.17** No "Chapter Order" label in DOM

#### chapters display (2 tests)
- [ ] **TC-3.18** Chapter titles visible in DOM when chapters present (chapters accordion auto-open)
- [ ] **TC-3.19** `onSave` called with `chapters: []` when no chapters

#### chapters editing (7 tests)
- [ ] **TC-3.20** Accordion toggles: "+ Add Chapter" appears then disappears on two clicks
- [ ] **TC-3.21** "+ Add Chapter" click adds one chapter title input; "No chapters defined" disappears
- [ ] **TC-3.22** Remove button deletes chapter, shifts remaining, clears `currentChapterId`
- [ ] **TC-3.23** Move-up button reorders chapters correctly; subsequent move-down restores order
- [ ] **TC-3.24** `currentChapterId` saved correctly after `userEvent.selectOptions` on chapter select
- [ ] **TC-3.25** Chapter title updated after `userEvent.clear` + `userEvent.type`
- [ ] **TC-3.26** Removing active chapter sets `currentChapterId` to `undefined` in saved payload

---

### Task 4 — Regression (full suite)

- [ ] **TC-4.1** `npx jest` (all unit tests) — zero failures after all component and test changes are in place.
  - Spec: "Tests are isolated (no shared mutable state)"
  - Task: Execution §4

- [ ] **TC-4.2** `npx tsc --noEmit` — zero TypeScript errors.
  - Spec: "TypeScript compiles cleanly"
  - Task: Execution §4

- [ ] **TC-4.3** Grep sanity: `grep -n "createReactRoot\|IS_REACT_ACT_ENVIRONMENT\|@jest-environment jsdom\|\.click()\|\.value =" tests/unit/components/CampaignEditor.test.tsx` → zero results.
  - Spec: "Legacy boilerplate absent" + "No manual DOM mutations"
  - Task: Execution §4
