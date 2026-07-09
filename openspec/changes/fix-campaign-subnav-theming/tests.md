---
name: tests
description: Tests for the fix-campaign-subnav-theming change
---

# Tests

## Overview

This document outlines the tests for the `fix-campaign-subnav-theming` change. All work should follow a strict TDD (Test-Driven Development) process.

An existing test file, `tests/unit/components/CampaignLayout.test.tsx`, already covers tab-bar routing/active-state behavior but asserts the *old* active-tab class (`border-b-2`). Several of its existing test cases (TC-3.2 through TC-3.6) must be updated in place to assert the new `bg-blue-600` filled-pill class instead, as part of this change — this is not new coverage being added, it's existing coverage being adjusted to match the modified requirement in `specs/campaign-subnav/spec.md` ("MODIFIED Tab bar on campaign sub-pages").

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write/update a test that captures the requirement of the task (e.g., update TC-3.2 to assert `bg-blue-600` and confirm it fails against the current underline-based implementation).
2.  **Write code to pass the test:** Make the minimal `layout.tsx`/page-file changes described in `tasks.md` to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — `app/campaigns/[id]/layout.tsx`: centralize background, restyle tabs

- [ ] **TC-1.1** (updates existing TC-3.2 in `CampaignLayout.test.tsx`): Given `mockPathname = '/campaigns/test-id'`, when `CampaignLayout` renders, then the "Members" link has class `bg-blue-600` and does NOT have class `border-b-2`; the "Sessions" link has neither `bg-blue-600` nor `border-b-2`. Maps to spec scenario: "Active tab renders as a filled pill" / "Inactive tabs render as plain text with no chip or underline".
- [ ] **TC-1.2** (updates existing TC-3.3): Given `mockPathname = '/campaigns/test-id/sessions'`, when rendered, then "Sessions" link has `bg-blue-600`, "Members" link does not. Maps to spec scenario: "Tab bar active-route matching is unchanged".
- [ ] **TC-1.3** (updates existing TC-3.4): Given `mockPathname = '/campaigns/test-id/prompts'`, when rendered, then "Prompts" link has `bg-blue-600`, "Members" link does not. Maps to spec scenario: "Active tab renders as a filled pill".
- [ ] **TC-1.4** (updates existing TC-3.5): Given `mockPathname = '/campaigns/test-id/library'`, when rendered, then "Library" link has `bg-blue-600`, "Members" link does not.
- [ ] **TC-1.5** (updates existing TC-3.6): Given `mockPathname = '/campaigns/test-id/sessions/some-session-id'` (nested route), when rendered, then "Sessions" link has `bg-blue-600`. Maps to spec scenario: "Tab bar active-route matching is unchanged".
- [ ] **TC-1.6** (new): Given the layout renders in its default (non-`isChatLarge`) branch, when queried, then the root content wrapper element (or an ancestor of the header/nav/children) has class `bg-gray-900` and `min-h-screen`. Maps to spec scenario: "Continuous background on default layout".
- [ ] **TC-1.7** (new): Simulate `isChatLarge = true` (via whatever mechanism triggers it in `CampaignLayout`, e.g. `onSizeChange` callback captured from the mocked `CampaignChat`), when rendered, then the `<main>` element wrapping header/nav/children has class `bg-gray-900`. Maps to spec scenario: "Continuous background with chat expanded".
- [ ] **TC-1.8** (existing, unchanged behavior — regression guard): TC-3.1 (all four tabs render), TC-3.7 (campaign name visible), TC-3.8 (graceful degradation on fetch failure), TC-3.9 (children render below tab bar), TC-3.10 (single fetch call), TC-3.11/TC-3.12 (session change propagation) must all continue to pass unmodified after this change — confirms no functional regression from the CSS-only edits.

### Task 2 — `app/campaigns/[id]/page.tsx`: remove duplicate background wrapper

- [ ] **TC-2.1** (new, if a render test exists or is added for this page): The page component's rendered output does not include an element with both `min-h-screen` and `bg-gray-900` classes at its top level. Maps to spec scenario: "Individual sub-pages no longer own their own background wrapper".
- [ ] **TC-2.2**: Existing tests for `app/campaigns/[id]/page.tsx` (Members list rendering, member actions, etc.) continue to pass unmodified — confirms removing the wrapper div doesn't affect content/functional behavior.

### Task 3 — `app/campaigns/[id]/sessions/page.tsx`: remove duplicate background wrapper

- [ ] **TC-3.1'** (new): The sessions page's rendered output does not include a top-level `min-h-screen bg-gray-900 text-white` wrapper. Maps to spec scenario: "Individual sub-pages no longer own their own background wrapper".
- [ ] **TC-3.2'**: Existing sessions-page tests continue to pass unmodified.

### Task 4 — `app/campaigns/[id]/prompts/page.tsx`: remove duplicate background wrapper

- [ ] **TC-4.1** (new): Both the loading-state render and the main content render omit the top-level `min-h-screen bg-gray-900 text-white` wrapper, while the inner `container mx-auto px-4 py-8` div is still present. Maps to spec scenario: "Individual sub-pages no longer own their own background wrapper".
- [ ] **TC-4.2**: Existing Prompt Builder tests (template selection, field rendering, generate/save actions) continue to pass unmodified.

### Task 5 — `app/campaigns/[id]/library/page.tsx`: remove duplicate background wrapper

- [ ] **TC-5.1** (new): The library page's rendered output does not include a top-level `min-h-screen bg-gray-900 text-white` wrapper, but the `<pre>` and `<textarea>` elements still carry their own (unrelated, nested) `bg-gray-900` classes unchanged. Maps to spec scenario: "Individual sub-pages no longer own their own background wrapper".
- [ ] **TC-5.2**: Existing library-page tests continue to pass unmodified.

### Task 6 — `app/campaigns/[id]/combat/page.tsx`: remove duplicate background wrapper

- [ ] **TC-6.1** (new): The loading-state div renders with classes `flex items-center justify-center text-white` and without `min-h-screen bg-gray-900`. Maps to spec scenario: "Individual sub-pages no longer own their own background wrapper" (design Decision 4).
- [ ] **TC-6.2**: Existing combat-page tests (setup view, active combat view) continue to pass unmodified.

### Task 7 — Manual/visual verification across both `isChatLarge` states

- [ ] **TC-7.1** (manual, not automatable via jest/RTL — visual only): Dev-server walkthrough of all five routes confirming no white seam and legible active-tab pill, per `tasks.md` Task 7. Record result (pass/fail + screenshot) in the PR description or as a review note.
- [ ] **TC-7.2** (manual): Confirm short-content page (empty Library) still fills viewport with dark background. Maps to spec scenario: "Background does not depend on individual page content height".

## Non-Functional Test Cases

- [ ] **TC-NFAC.1**: TC-3.10 (existing, "Single fetch call") continues to assert exactly one call to `/api/campaigns/${id}` — confirms no additional network requests were introduced by this change. Maps to NFAC "Fetch behavior unchanged".
