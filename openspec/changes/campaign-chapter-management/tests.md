---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `campaign-chapter-management` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — Add Unit Tests (TDD)
- [ ] **Test Case 1.1:** Add Jest test inside `tests/unit/components/CampaignEditor.test.tsx` verifying that clicking the "Chapters" accordion header toggles the collapsible chapters editing section. (Spec: Scenario: DM adds a new chapter to a campaign)
- [ ] **Test Case 1.2:** Add Jest test verifying that clicking "+ Add Chapter" appends a new row with an empty title input, unique ID, and correct `order` field. (Spec: Scenario: DM adds a new chapter to a campaign)
- [ ] **Test Case 1.3:** Add Jest test verifying that clicking "Remove" deletes the selected chapter row, shifts subsequent chapters up, and resets `currentChapterId` if the active chapter was removed. (Spec: Scenario: DM removes a chapter from a campaign, Scenario: Safe cleanup when active chapter is deleted)
- [ ] **Test Case 1.4:** Add Jest test verifying that clicking the "▲" (Move Up) and "▼" (Move Down) buttons swaps chapter order and sequence indexes correctly. (Spec: Scenario: DM reorders chapters using Move Up/Down buttons)
- [ ] **Test Case 1.5:** Add Jest test verifying that selecting an active chapter option in the dropdown updates `currentChapterId` and renders the dropdown with the correct selection. (Spec: Scenario: DM selects a current active chapter)

### Task 2 — Implement Campaign Form Components
- [ ] **Test Case 2.1:** Verify that the manual rendering of the form shows the Collapsible Chapter List Editor accordion when no chapters are defined, showing "No chapters defined" message instead of a select dropdown. (Spec: Scenario: Active chapter fallback when no chapters are defined)
- [ ] **Test Case 2.2:** Verify that all chapter state modification handlers (add, remove, shift, title edit) behave correctly when executed interactively and that the full list is passed back upon submitting the form. (Spec: Scenario: DM adds a new chapter to a campaign)

### Task 3 — Dashboard Displays Active Chapter
- [ ] **Test Case 3.1:** Add Jest unit test in `tests/unit/campaigns/page.test.tsx` (or update existing page rendering tests) verifying that a campaign card with `currentChapterId` displays the resolved active chapter title in the format `📖 Current Chapter: Ch. N: Title`. (Spec: Scenario: Campaign card shows current active chapter title)
- [ ] **Test Case 3.2:** Verify that a campaign with no active chapter or no chapters displays only the standard total chapter count without showing the active chapter prefix. (Spec: Scenario: Campaign card without active chapter shows standard count only)

### Task 4 — POST API Route Updates
- [ ] **Test Case 4.1:** Write unit/integration tests that POST to `/api/campaigns` with a complete chapters payload and `currentChapterId` and assert the database record persists successfully. (Spec: Scenario: POST campaign successfully persists chapters and current chapter ID)
- [ ] **Test Case 4.2:** Assert that posting an invalid `currentChapterId` (not present in `chapters`) results in server sanitizing `currentChapterId` to `undefined` or rejecting/cleaning the field safely. (Spec: Scenario: Safe cleanup when active chapter is deleted)

### Task 5 — PATCH API Route Updates
- [ ] **Test Case 5.1:** Write unit/integration tests that PATCH to `/api/campaigns/[id]` to update chapters list and active chapter, ensuring all elements are sanitized and mapped correctly. (Spec: Scenario: PATCH campaign successfully updates chapters and current chapter ID)

### Task 6 — Add API Integration Tests
- [ ] **Test Case 6.1:** Write automated integration tests in `tests/integration/campaigns.integration.test.ts` implementing a full campaign lifecycle (create with chapters, update chapters, reorder/delete, select active chapter, retrieve cards). (Spec: Scenario: POST campaign..., Scenario: PATCH campaign..., Scenario: Legacy campaign recovery)
