---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `migrate-native-confirm-sites` change. All work follows strict TDD: write the failing test, observe it fail, implement, refactor. Tests drive the real dialog via `confirm-dialog-confirm` / `confirm-dialog-cancel` test ids; no `window.confirm` mocks. Pattern per site: click the row control → dialog visible with the right title/labels → confirm sends exactly one DELETE to the clicked item's URL; cancel sends none.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test** capturing the requirement; run it and confirm it fails.
2.  **Write the simplest code** to pass.
3.  **Refactor** while keeping tests green.

## Test Cases

### Task 1 — Characters (spec: "Confirm performs the action once", "Cancel performs nothing", "Labels name the action")

- [ ] T1: list page (`tests/unit/import/charactersPageImport.test.ts` or a new `charactersPage` test) — confirm deletes once; labels "Delete"/"Keep"
- [ ] T2: list page — cancel/Escape sends no DELETE
- [ ] T3: detail page (`tests/unit/app/characters/[id]/page.test.tsx`) — confirm deletes once and navigates as before
- [ ] T4: detail page — cancel sends no DELETE

### Task 2 — Monsters

- [ ] T5: `useMonsterTemplates` (new `tests/unit/hooks/useMonsterTemplates.test.tsx` or page test) — `deleteTemplate` opens `deleteDialog`; confirm sends one DELETE to the mode-correct endpoint
- [ ] T6: cancel sends no DELETE

### Task 3 — Campaigns

- [ ] T7: `tests/unit/components/CampaignsPage.test.tsx` — confirm deletes campaign once
- [ ] T8: cancel sends no DELETE
- [ ] T9: `tests/unit/components/CampaignMembersPage.test.tsx` — confirm removes the clicked member (correct URL); cancel does nothing
- [ ] T10: `tests/unit/campaignEncountersPage.test.tsx` — unlink dialog shows existing `unlinkConfirmMessage` wording; confirm unlinks once (replaces `confirmText` capture mock)
- [ ] T11: unlink cancel sends no DELETE
- [ ] T12: `tests/unit/components/SessionsPage.test.tsx` — confirm deletes the clicked session log; cancel does nothing

### Task 4 — Parties and encounters

- [ ] T13: parties page — confirm deletes the clicked party once
- [ ] T14: parties page — cancel does nothing
- [ ] T15: `tests/unit/components/EncountersPage.test.tsx` — confirm deletes the clicked encounter once
- [ ] T16: encounters page — cancel does nothing

### Task 5/6 — Cleanup

- [ ] T17: `rg "window.confirm|global.confirm|spyOn\(window, 'confirm'\)" tests` is empty (including `tests/unit/hooks/useCombat.test.ts`)
- [ ] T18: `rg "\bconfirm\(" app lib` shows no native call sites; E2E (free port, not 3000) for any delete/unlink flow passes
