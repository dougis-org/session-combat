---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-user-preference-persistence` change. All work follows strict TDD: write a failing test from the spec scenario, write the minimal code to pass, then refactor. Every case below maps to a task in `tasks.md` and an acceptance scenario in `specs/user-preferences/spec.md`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the task's spec scenario. Run it; confirm it fails for the right reason.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping it green.

Command reference: `npx jest <path>` (unit), `npm run test:integration -- <filter>` (integration), `npm run test:e2e` (E2E), `npm run typecheck`, `npm run build`.

## Test Cases

### T1 — Preference schema module (`lib/preferences/__tests__/schema.test.ts`)

- [ ] `DEFAULT_PREFERENCES` contains exactly the v1 keys with expected defaults (`dice.sendToChat=false`, `dice.disableAnimation=null`, `chat.pinned=false`, `chat.size`=dock default, `dice.color=null`) — maps: task T1, spec "User model carries optional preferences"
- [ ] `resolvePreferences({})` returns the full defaults — maps: T1, spec scenario "User without preferences"
- [ ] `resolvePreferences` deep-merges a partial stored `values` onto defaults without mutating defaults — maps: T1, spec "Preferences persist across sessions and devices" / "Server stores the merged delta"
- [ ] `resolvePreferences` drops unknown keys present in stored `values` — maps: T1, spec NFAC "Corrupt or stale-version stored data"
- [ ] `resolvePreferences` repairs a wrongly-typed stored value by falling back to that key's default — maps: T1, spec NFAC "Corrupt or stale-version stored data"
- [ ] `resolvePreferences` handles an older `schemaVersion` by merging only valid known deltas — maps: T1, spec NFAC "Corrupt or stale-version stored data"
- [ ] `validatePreferencePatch` returns `ok:false` for `null`, an array, a string, a number, and malformed input — maps: T1, spec scenario "Non-object body is rejected"
- [ ] `validatePreferencePatch` returns `ok:false` when `dice.sendToChat` is `1` or `chat.size` is `"large"` — maps: T1, spec scenario "Wrongly-typed value is rejected"
- [ ] `validatePreferencePatch` returns `ok:false` when `chat.size` is below min or above max — maps: T1, spec scenario "Out-of-range value is rejected"
- [ ] `validatePreferencePatch` strips unknown keys and keeps known ones (`{dice:{sendToChat:true},bogusKey:5}` → `{dice:{sendToChat:true}}`) — maps: T1, spec scenario "Unknown keys are stripped"
- [ ] `validatePreferencePatch` accepts `dice.color=null` and a valid short hex, rejects `dice.color` containing markup/control chars or a non-hex string — maps: T1, spec NFAC "Stored preference values cannot inject markup downstream"
- [ ] `validatePreferencePatch` accepts `dice.disableAnimation` of `true`, `false`, and `null` — maps: T1, spec "Existing preference hooks keep their contract"

### T2 — User type (`npm run typecheck`)

- [ ] `User.preferences` is optional and typed as `{ schemaVersion:number; values:Partial<PreferenceValues>; updatedAt:Date }`; a `User` literal without `preferences` type-checks — maps: T2, spec MODIFIED "User model carries optional preferences"

### T3 — Server storage helpers (integration)

- [ ] `getUserPreferences(userId)` for a user with no `preferences` field returns resolved defaults, no throw — maps: T3, spec scenario "User without preferences" / "New user receives resolved defaults"
- [ ] `updateUserPreferences(userId, {chat:{pinned:true}})` `$set`s `preferences.values.chat.pinned`, `preferences.updatedAt`, `preferences.schemaVersion` and leaves other stored deltas intact — maps: T3, spec scenario "Server stores the merged delta"
- [ ] persist→read round-trip: after `updateUserPreferences`, `getUserPreferences` reflects the value — maps: T3, spec "Preferences persist across sessions and devices"
- [ ] invalid `userId` throws `InvalidUserIdError` (matches existing storage pattern) — maps: T3, spec NFAC "Preferences are scoped to the authenticated user"
- [ ] `getUserPreferences` / `updateUserPreferences` invoke the `runStorageOp` seam with a preference read/write op label (spy) — maps: T3, spec NFAC "Preference storage operations are observable"
- [ ] `updateUserPreferences` only stores non-default values (a value equal to the default is not written / is unset) — maps: T3, spec scenario "Only non-default values are stored"

### T4 — API route (`app/api/me/preferences`) (integration/route tests)

- [ ] `GET` unauthenticated → 401 — maps: T4, spec NFAC Security cross-ref
- [ ] `PATCH` unauthenticated → 401, no write — maps: T4, spec NFAC Security cross-ref
- [ ] `GET` for a new authenticated user → 200 with full resolved defaults + `schemaVersion`, `Cache-Control: no-store` — maps: T4, spec scenario "New user receives resolved defaults"
- [ ] `GET` for a user with stored deltas → 200 with defaults merged with those deltas — maps: T4, spec "Preferences load on authentication"
- [ ] `PATCH` with a valid partial → 200, echoes resolved result, document updated — maps: T4, spec scenario "Server stores the merged delta"
- [ ] `PATCH` non-object/array/null/malformed body → 400, document unchanged — maps: T4, spec scenario "Non-object body is rejected"
- [ ] `PATCH` wrongly-typed value → 400, no field written — maps: T4, spec scenario "Wrongly-typed value is rejected"
- [ ] `PATCH` out-of-range `chat.size` → 400, no field written — maps: T4, spec scenario "Out-of-range value is rejected"
- [ ] `PATCH` with unknown keys → 200, known keys persisted, unknown keys absent from document — maps: T4, spec scenario "Unknown keys are stripped"
- [ ] user A's `PATCH` modifies only A's document; B's document unchanged; body carrying a `userId` is ignored — maps: T4, spec NFAC scenario "Preferences are scoped to the authenticated user"
- [ ] end-to-end persistence: `PATCH` as user, drop auth cookie, re-authenticate, `GET` returns the value — maps: T4, spec scenario "Preference survives logout and re-login on another device"

### T5 — Client preferences provider (`lib/preferences/__tests__/usePreferences.test.tsx`)

- [ ] hydration order: reads mirror first, then issues one `GET /api/me/preferences`, then writes reconciled result to mirror — maps: T5, spec NFAC "First paint does not wait on the network"
- [ ] exactly one `GET /api/me/preferences` per auth transition; zero on simulated client route change — maps: T5, spec scenario "Single preference fetch on auth success"
- [ ] `setPreference` updates context synchronously and writes the mirror immediately — maps: T5, spec scenario "Optimistic update and debounced persistence"
- [ ] with fake timers, a single `setPreference` produces exactly one debounced `PATCH` carrying the value — maps: T5, spec scenario "Optimistic update and debounced persistence"
- [ ] three `setPreference` calls to `chat.size` within the debounce window → one `PATCH` with the final value — maps: T5, spec scenario "Rapid consecutive changes coalesce"
- [ ] adoption: legacy key `sessionCombat:v1:dice-fab-send-to-chat=true` + server `dice.sendToChat` unset → one seeding `PATCH` with `true`, resolved value `true` — maps: T5, spec scenario "Local value adopted when server is unset"
- [ ] adoption: local `dice.sendToChat=true` + server `dice.sendToChat=false` → resolved `false`, mirror updated to `false`, no seeding `PATCH` — maps: T5, spec scenario "Server value wins over a stale local value"
- [ ] synthetic `storage` event for the mirror key → context updates to the new value and no `PATCH` is sent — maps: T5, spec scenario "Second tab observes a change"
- [ ] `storage` event with an unrelated key is ignored — maps: T5, spec scenario "Preferences sync across tabs"
- [ ] unauthenticated provider: no `GET`/`PATCH`; `setPreference` still writes the mirror and updates context — maps: T5, spec scenario "Logged-out user toggles a preference"
- [ ] `localStorage` access throwing → `setPreference` updates in-memory value, logs a warning, does not throw — maps: T5, spec scenario "Local storage unavailable"
- [ ] `PATCH` rejecting → context + mirror still update, failure logged, retried on the next `setPreference` and on next hydration — maps: T5, spec scenario "Preference PATCH fails" + NFAC "Recovery behavior after a failed sync"

### T6 — Provider mount

- [ ] a component consuming `usePreferences()` renders preference-bound UI from the mirror before the mocked `GET` resolves, then reconciles — maps: T6, spec NFAC "First paint does not wait on the network"
- [ ] the preferences fetch is dispatched without awaiting other bootstrap fetches (not serialized behind them) — maps: T6, spec NFAC scenario "Startup preference load cost"

### T7 — Refactored `useDiceFabPreferences` (`lib/dice/__tests__/useDiceFabPreferences*.test.tsx`)

- [ ] existing suite passes unchanged when rendered inside a `PreferencesProvider` test wrapper — maps: T7, spec scenario "Dice-fab hook behavior preserved"
- [ ] `disableAnimation` still falls back to `prefers-reduced-motion` when never chosen and the first explicit choice wins thereafter — maps: T7, spec scenario "Dice-fab hook behavior preserved"
- [ ] `setSendToChat` / `setDisableAnimation` call through to `setPreference` with `dice.sendToChat` / `dice.disableAnimation` — maps: T7, spec scenario "Dice-fab hook behavior preserved"

### T8 — Refactored `useDockState` (existing suite path)

- [ ] existing suite passes unchanged inside the provider wrapper — maps: T8, spec scenario "Dock-state hook behavior preserved"
- [ ] pin/size updates call `setPreference` with `chat.pinned` / `chat.size`; size is clamped to the existing range — maps: T8, spec scenario "Dock-state hook behavior preserved"

### T9 — `/api/auth/me` unchanged (integration)

- [ ] `GET /api/auth/me` response body keys are exactly `authenticated`, `userId`, `email`, `isAdmin`, `username` — no preference fields — maps: T9, spec scenario "auth/me payload unchanged"

### T10 — Regression / full-suite gates

- [ ] `npm run typecheck` passes — maps: T2, T10
- [ ] `npm run lint` passes — maps: T10
- [ ] `npm run test:unit` passes — maps: all unit tasks
- [ ] `npm run test:integration` passes — maps: T3, T4, T9
- [ ] `npm run test:e2e` passes (no regression in dice-fab / campaign-chat flows) — maps: T7, T8, spec "Existing preference hooks keep their contract"
- [ ] `npm run build` succeeds — maps: T6, T10
- [ ] `openspec validate add-user-preference-persistence` passes — maps: Validation section
