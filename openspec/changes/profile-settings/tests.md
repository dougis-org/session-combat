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

### Coverage gaps identified in explore review (tracked as FU-4 in tasks.md)

`ProfilePage.test.tsx` exercises only one of the five controls it renders. Missing:

- [ ] Test case: `dice.disableAnimation` select — `system`/`enabled`/`disabled` map to
  `setPreference('dice.disableAnimation', null | false | true)`, and the current value
  renders the right option selected.
- [ ] Test case: `dice.surface` select — choosing `Wood` calls
  `setPreference('dice.surface', 'wood')`; choosing `Default` calls it with `null`;
  a stored `'metal'` renders `Metal` selected. (Directly covers spec Scenario "Edit dice
  preferences → change the Dice Surface setting", currently untested at the UI layer.)
- [ ] Test case: `dice.color` text input — a valid hex calls
  `setPreference('dice.color', '#ff0000')`; clearing calls it with `null`; an invalid
  partial entry does **not** call `setPreference` (and, once FU-3 lands, shows the invalid
  state).
- [ ] Test case: `chat.pinned` checkbox binds to `setPreference('chat.pinned', …)` and
  reflects the stored value.
- [ ] Test case: non-default preferences render with the correct checked/selected state
  (currently every assertion uses `DEFAULT_PREFERENCES`, so a "read" regression would pass).
- [ ] Test case (integration): `PATCH /api/me/preferences` with `{ dice: { surface: 'wood' } }`
  persists and round-trips via `GET` — spec Scenario "Save valid surface preference" is only
  covered at the `validatePreferencePatch` unit level, not through the route.
- [ ] Test case (E2E, optional): open User Menu → click "Profile & Settings" → land on
  `/profile` with controls visible — spec Scenario "Navigate to profile page".
