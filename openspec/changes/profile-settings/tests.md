---
name: tests
description: Tests for the profile-settings change
---

# Tests

## Overview

This document outlines the tests for the `profile-settings` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Shipped in PR #674

- [x] Test case: `isValidPreferenceValue` allows `surface` string / rejects non-string in `schema.test.ts`
- [x] Test case: `validatePreferencePatch` accepts `dice.surface` null and `'wood'` in `schema.test.ts`
- [x] Test case: `DEFAULT_PREFERENCES` includes `dice.surface: null`
- [x] Test case: `UserMenu.test.tsx` renders "Profile & Settings" link → `href="/profile"`
- [x] Test case: `UserMenu.test.tsx` keyboard-open moves focus to the "Profile & Settings" item
- [x] Test case: `ProfilePage.test.tsx` renders without crashing for authenticated user
- [x] Test case: `ProfilePage.test.tsx` binds `dice.sendToChat` checkbox to `setPreference`
- [x] Test case: `ProfilePage.test.tsx` redirects unauthenticated user via `<ProtectedRoute>`

### Coverage gap close-out (FU-4 — done in this branch)

`ProfilePage.test.tsx` previously exercised only one of the five controls. Now covered
(21 cases in `tests/unit/app/profile/page.test.tsx`):

- [x] Every control resolves by accessible name (added `htmlFor`/`id` to the three selects
  / colour input; the "Dice Color (Hex)" `<label>` is now a real label, not orphan text).
- [x] `dice.disableAnimation` select — `System Default` / `Enabled` / `Disabled` map to
  `setPreference('dice.disableAnimation', null | false | true)`; each stored value renders
  the matching option selected.
- [x] `dice.surface` select — `Wood` → `setPreference('dice.surface', 'wood')`; `Default` →
  `null`; stored `'stone'` renders selected; null renders `Default`; options are exactly
  `default/wood/metal/stone/felt`. (Covers spec Scenario "Edit dice preferences".)
- [x] `dice.color` input — a valid hex calls `setPreference('dice.color', '#f00')`; clearing
  calls it with `null`; a stored colour renders as the field value; an invalid entry is
  **not** persisted and surfaces `aria-invalid` + a `role="alert"` message; fixing it to a
  valid value then persists and clears the alert. (FU-3 landed alongside these tests.)
- [x] `dice.sendToChat` and `chat.pinned` checkboxes — bind to `setPreference` and reflect a
  stored `true` as checked.
- [x] Integration (`tests/integration/api/mePreferences.test.ts`): `PATCH /api/me/preferences`
  with `dice.surface` persists + round-trips via `GET`; `surface: null` clears the stored
  value; a wrongly-typed `surface` → 400 with no write. (Covers spec Scenario "Save valid
  surface preference".)

Deferred:

- [ ] Test case (E2E, optional): open User Menu → click "Profile & Settings" → land on
  `/profile` with controls visible — spec Scenario "Navigate to profile page". Link + route
  are covered at the `UserMenu` unit level; a full-navigation E2E is nice-to-have.
