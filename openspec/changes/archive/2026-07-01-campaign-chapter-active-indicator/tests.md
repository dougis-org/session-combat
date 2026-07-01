---
name: tests
description: Tests for the campaign-chapter-active-indicator change
---

# Tests

## Overview

Test coverage for `campaign-chapter-active-indicator`. All work follows strict TDD: write a failing test first, then implement the minimum code to pass it, then refactor.

Test file: `tests/unit/components/CampaignEditor.test.tsx`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — capture the requirement before writing implementation code. Run `npm run test:unit` and confirm it fails.
2. **Write code to pass the test** — implement the minimum change in `app/campaigns/CampaignEditor.tsx` to make the test pass.
3. **Refactor** — clean up while keeping tests green.

## Test Cases

### Task 1a — Display-only current chapter block

- [ ] **Display block shows active chapter name**
  - Render `CampaignEditor` with two chapters, `currentChapterId` set to chapter 1's id
  - Assert `getByTestId('current-chapter-display')` text contains "Ch. 1:" and chapter 1's title
  - Spec: "Active chapter name is shown in display block"

- [ ] **Display block shows placeholder when no active chapter**
  - Render `CampaignEditor` with chapters, `currentChapterId` undefined
  - Assert `getByTestId('current-chapter-display')` text is "-- No active chapter --"
  - Spec: "Placeholder shown when no active chapter is set"

- [ ] **Display block absent when no chapters**
  - Render `CampaignEditor` with empty chapter array
  - Assert `queryByTestId('current-chapter-display')` returns null
  - Spec: "Display block absent when no chapters exist"

- [ ] **No select element in DOM**
  - Render `CampaignEditor` with chapters
  - Assert `queryByTestId('current-chapter-select')` returns null
  - Spec: REMOVED Interactive current-chapter select dropdown

### Task 1b — ACTIVE pill on active chapter row

- [ ] **ACTIVE pill present on active chapter row**
  - Render with chapter A active (`currentChapterId = A.id`)
  - Assert `getByTestId(`active-chapter-indicator-${A.id}`)` is in the document
  - Spec: "ACTIVE pill appears on the active chapter row"

- [ ] **ACTIVE pill absent on inactive chapter rows**
  - Render with chapter A active, chapter B inactive
  - Assert `queryByTestId(`active-chapter-indicator-${B.id}`)` returns null
  - Spec: "ACTIVE pill appears on the active chapter row"

- [ ] **No ACTIVE pill when currentChapterId is unset**
  - Render with `currentChapterId` undefined
  - Assert no element with testid matching `active-chapter-indicator-*` exists
  - Spec: "No ACTIVE pill when no chapter is active"

### Task 1c — 🚩 activate button on inactive rows

- [ ] **Activate button present on inactive rows**
  - Render with chapter A active, chapter B inactive
  - Assert `getByTestId(`activate-chapter-${B.id}`)` is in the document
  - Spec: "Activate button appears on inactive chapter rows"

- [ ] **Activate button absent on active row**
  - Render with chapter A active
  - Assert `queryByTestId(`activate-chapter-${A.id}`)` returns null
  - Spec: "Activate button appears on inactive chapter rows"

- [ ] **Activate button has correct tooltip**
  - Render with an inactive chapter B
  - Assert `getByTestId(`activate-chapter-${B.id}`)` has `title="Mark as current chapter"`
  - Spec: "Activate button appears on inactive chapter rows"

- [ ] **Clicking activate button sets chapter as active**
  - Render with chapter A active, chapter B inactive
  - Click `activate-chapter-${B.id}`
  - Assert `current-chapter-display` now contains chapter B's title
  - Assert `active-chapter-indicator-${B.id}` is present
  - Assert `active-chapter-indicator-${A.id}` is absent
  - Assert `activate-chapter-${A.id}` is now present (A is now inactive)
  - Spec: "Clicking activate button sets that chapter as active"

- [ ] **Activate buttons disabled while saving**
  - Render with saving state active
  - Assert all `activate-chapter-*` buttons have `disabled` attribute
  - Spec: "Activate button is disabled while saving"

### Task 2 — Regression: existing chapter row functionality unchanged

- [ ] **Move up/down buttons still present and functional**
  - Render with multiple chapters
  - Assert `move-up-1` and `move-down-0` buttons exist (verifying existing testids unchanged)
  - Click move-up on chapter 1 and assert order changes

- [ ] **Remove button still clears currentChapterId when active chapter removed**
  - Render with chapter A active
  - Click `remove-chapter-0` (chapter A)
  - Assert `current-chapter-display` shows "-- No active chapter --"
  - Spec: "Active chapter deleted while set as current" (NFAC Reliability)
