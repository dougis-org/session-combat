---
name: tests
description: Tests for the fix-resize-test-opendock-shadow change
---

# Tests

## Overview

This document outlines the tests for the `fix-resize-test-opendock-shadow` change. This change is a pure identifier rename (plus a comment addition) with no new logic, so there are no new production behaviors to drive with new failing tests. Instead, the existing `CampaignChat.resize.test.tsx` suite serves as the regression net: it must be green before the rename (baseline), and identically green after (verification), with an added structural check that the naming collision is actually gone.

## Testing Steps

For each task in `tasks.md`:

1.  **Capture the failing/absent state:** confirm the collision exists before the fix (local `openDock` in `resize.test.tsx` still shadows `helpers.tsx`'s export) and that the baseline test suite passes under the *old* name.
2.  **Apply the rename:** make the code change (rename + call-site updates + guardrail comment).
3.  **Verify:** re-run the same suite and confirm identical pass results under the *new* name, and confirm the collision is structurally gone.

## Test Cases

### Task: rename local `openDock` to `openDockLocal` in `CampaignChat.resize.test.tsx`

- [ ] **Baseline (pre-change):** run `npx jest tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx` and confirm all existing tests (13) pass under the current (colliding) name. This is the pre-existing green state the rename must not break.
- [ ] **Structural check (post-change):** `grep -n "^async function openDock\b" tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx` returns no match; `grep -n "^async function openDockLocal\b"` returns exactly one match at the renamed declaration.
  - Maps to task: "rename the local `async function openDock()` ... to `async function openDockLocal()`"
  - Maps to acceptance scenario: "Local resize-drag helper no longer collides with the shared `openDock` export" (`specs/testing-conventions/spec.md`)

### Task: update the 4 call sites from `openDock()` to `openDockLocal()`

- [ ] **Structural check:** `grep -n "openDock()" tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx` returns no match (no bare `openDock()` call remains); `grep -c "openDockLocal()" tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx` returns `4`.
  - Maps to task: "Update the 4 call sites ... from `openDock()` to `openDockLocal()`"
  - Maps to acceptance scenario: "Renamed helper is used consistently at every call site"

### Task: verify existing test behavior is unchanged

- [ ] **Regression run (post-change):** run `npx jest tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx` and confirm all tests still pass, with the same test names and same assertions as the pre-change baseline (no test added, removed, or altered — diff the test file outside the renamed identifier and confirm no other lines changed).
  - Maps to task: "Confirm acceptance criteria in ... spec.md are covered"
  - Maps to acceptance scenario: "All resize tests continue to pass with unchanged assertions"
- [ ] **Suite-wide regression run:** run `npx jest tests/unit/components/CampaignChat/` and confirm no other file in the directory is affected (none import from `resize.test.tsx`, so this should be a no-op check, but confirms isolation).
  - Maps to task: "Run the full `CampaignChat` test directory to confirm no other file references the renamed local function"

### Task: add guardrail comment to `helpers.tsx`

- [ ] **Presence check:** `grep -n "must not reuse\|naming collision\|shadow" tests/unit/components/CampaignChat/helpers.tsx` (or equivalent phrasing check) returns at least one match near the exported helpers.
  - Maps to task: "add a one-line comment near the exported helpers ..."
  - Maps to acceptance scenario: "Guardrail comment is present and visible near the exports"
- [ ] **No behavior change:** run `npx jest tests/unit/components/CampaignChat/` again after the comment addition and confirm identical pass/fail results to the prior run (comment-only diff must not affect any test outcome).
