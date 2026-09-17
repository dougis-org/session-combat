---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `auto-scroll-next-combatant` change. All work should follow a strict TDD (Test-Driven Development) process: write each failing test first, implement the minimum code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Schema (`lib/preferences/schema.ts`) — task: "Schema (design Decision 3)" / "Schema tests"

- [x] `KEY_VALIDATORS["combat.autoScrollToNextCombatant"]` accepts `true` and `false`
- [x] `KEY_VALIDATORS["combat.autoScrollToNextCombatant"]` rejects non-boolean values (string, number, null, object)
- [x] `DEFAULT_PREFERENCES.combat.autoScrollToNextCombatant === true`
- [x] `resolvePreferences({})` (nothing stored) resolves `combat.autoScrollToNextCombatant` to `true` — covers spec `user-preferences` scenario "Default auto-scroll value is not persisted" (read side)
- [x] `resolvePreferences({ combat: { autoScrollToNextCombatant: "yes" } })` (malformed stored value) resolves to the default `true`, does not throw — covers spec `user-preferences` scenario "Malformed stored value degrades to default"
- [x] `resolvePreferences({ combat: { autoScrollToNextCombatant: false } })` resolves to `false` — covers spec `user-preferences` scenario "Auto-scroll preference survives logout and re-login on another device" (resolve side)
- [x] `sparseKnownValues({ combat: { autoScrollToNextCombatant: false } })` includes `combat.autoScrollToNextCombatant: false`
- [x] `validatePreferencePatch({ combat: { autoScrollToNextCombatant: true } })` returns `ok: true` with the value included
- [x] `validatePreferencePatch({ combat: { autoScrollToNextCombatant: "true" } })` returns `ok: false`
- [x] `partitionPreferenceDelta({ combat: { autoScrollToNextCombatant: true } })` (equal to default) routes to `unset["preferences.values.combat.autoScrollToNextCombatant"]` — covers spec `user-preferences` scenario "Default auto-scroll value is not persisted" (write side)
- [x] `partitionPreferenceDelta({ combat: { autoScrollToNextCombatant: false } })` (non-default) routes to `set["preferences.values.combat.autoScrollToNextCombatant"] = false`

### Client provider (`lib/preferences/usePreferences.tsx`) — task: "Client provider"

- [x] Setting `combat.autoScrollToNextCombatant` via the provider's set-path updates context state immediately (optimistic) and is reflected in the local mirror, same as an existing key (e.g. `chat.pinned`)
- [x] `useFallbackPreferences()` (offline/no-auth path) resolves `combat.autoScrollToNextCombatant` to the schema default `true` — covers spec `combat-turn-auto-scroll` scenario "Preference unresolved falls back to default (on)"

### API route / repo (`app/api/me/preferences/route.ts`, `lib/storage/userPreferencesRepo.ts`) — task: "API route / repo"

- [x] `PATCH /api/me/preferences` with `{ combat: { autoScrollToNextCombatant: false } }` returns the resolved preferences including the new value
- [x] `GET /api/me/preferences` after the above PATCH returns `combat.autoScrollToNextCombatant: false`
- [x] `updateUserPreferences` persists only the non-default value (Mongo `$set`) and `$unset`s it when patched back to the default

### Combat view scroll wrapper (`lib/components/ActiveCombatView.tsx`) — task: "Combat view scroll wrapper" / "Combat view unit tests"

- [x] Given `combat.autoScrollToNextCombatant` resolves `true` and the active combatant is not the last able to act, clicking "Current Turn (done)" calls `Element.prototype.scrollIntoView` exactly once with `{ behavior: 'smooth', block: 'nearest' }` on the element matching the new active combatant's `data-combatant-id` — covers spec `combat-turn-auto-scroll` scenario "DM completes a turn with auto-scroll enabled"
- [x] Given `combat.autoScrollToNextCombatant` resolves `false`, clicking "Current Turn (done)" does not call `scrollIntoView` — covers scenario "DM completes a turn with auto-scroll disabled"
- [x] Given a downed combatant (hp <= 0) sits between the current and next-eligible combatant in list order, clicking "Current Turn (done)" scrolls to the next-eligible combatant's card, not the downed one's — covers scenario "Turn advances past a downed combatant"
- [x] Given the active combatant is the last able to act in the round, clicking "Current Turn (done)" scrolls to the first-eligible combatant's card of the new round (which appears above the previous one in the DOM) — covers scenario "Turn wraps to the start of the round"
- [x] Clicking "Restart Round" does not call `scrollIntoView`, even though the active combatant changes — covers scenario "Restarting the round does not trigger auto-scroll"
- [x] Removing a combatant that shifts `currentTurnIndex`'s resolved combatant does not call `scrollIntoView` — covers scenario "Removing a combatant does not trigger auto-scroll"

### Profile page toggle (`app/profile/page.tsx`) — task: "Profile page toggle" / "Profile page tests"

- [x] `/profile` renders an "Auto-scroll to next combatant" toggle reflecting the current `combat.autoScrollToNextCombatant` value from `usePreferences()`
- [x] Toggling the control calls `usePreferences()`'s set-path with the new boolean value, matching the existing dice/chat toggle call pattern — covers spec `profile-settings` scenario "Edit combat auto-scroll preference"

### E2E (`tests/e2e/combat.spec.ts`) — task: "E2E"

- [x] In a combat with enough combatants to exceed one viewport height, clicking "Current Turn (done)" results in the new active combatant's card being within the visible viewport (real browser, real smooth scroll) — end-to-end coverage of spec `combat-turn-auto-scroll` scenario "DM completes a turn with auto-scroll enabled"
