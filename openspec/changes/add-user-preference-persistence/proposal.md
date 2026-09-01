## GitHub Issues

- #619

## Why

- Problem statement: User-facing preferences (dice-fab "send to chat", dice animation
  toggle, campaign chat dock pin/size) are persisted only in browser `localStorage`
  via per-hook keys under the `sessionCombat:v1:` prefix. They are wiped on `logout()`
  (`lib/hooks/useAuth.ts` clears `LocalStore`, `SyncQueue`, `clientStorage`) and never
  follow the user to another browser or device. There is no server-side home for
  "things this user changed from the default," and no single load path at login.
- Why now: The product is adding more per-user options (dice roll options, preferred
  colors, and more to come). Without a persistence contract now, each new option
  repeats the same ad hoc `safeGet`/`safeSet` + `useReducer` INIT pattern and inherits
  the same "resets on logout / new device" problem.
- Business/user impact: Users who sign in on a new device or after logging out lose
  their configured experience and must re-set every option. A durable, account-scoped
  preference store makes the app feel persistent and personal, and gives future
  option work a ready-made slot instead of new bespoke storage.

## Problem Space

- Current behavior:
  - `User` (`lib/types.ts:283`) has no preferences field.
  - `AuthPayload` (`lib/types.ts:298`) carries only `userId`, `email`, `tokenVersion`
    in the signed 7-day JWT cookie — not a place for mutable preferences.
  - `GET /api/auth/me` (`app/api/auth/me/route.ts`) already performs an extra
    `getUserById` to fold in `isAdmin` and `username`; it is `Cache-Control: no-store`
    and is re-fetched by `useAuth()` on mount and every route change.
  - Preference reads/writes are scattered: `lib/dice/useDiceFabPreferences.ts`
    (`dice-fab-send-to-chat`, `dice-fab-disable-animation`),
    `lib/components/CampaignChat/useDockState.ts` (`campaign-chat-pin`,
    `campaign-chat-size`). Each re-implements `safeGet`/`safeSet` over
    `lib/offline/LocalStore.ts` plus a `useReducer` `INIT` effect (decision n125).
  - No `PATCH /api/me` or `/api/users/[id]` write path exists; `/api/me/` only hosts
    `invitations`.
  - No "preferred colors" / dice-color preference exists in code yet — that is
    greenfield and only needs a schema slot here.
- Desired behavior:
  - A typed, versioned `preferences` document stored server-side and scoped to the
    authenticated user, holding only values that differ from defaults (sparse).
  - A single client load path: on authentication success, fetch the user's
    preferences once, hydrate an app-level provider, and mirror them into
    `localStorage` so existing offline-first hooks keep working.
  - A single write path: `setPreference(path, value)` updates the provider
    optimistically, mirrors to `localStorage`, and persists to the server
    (debounced, last-write-wins).
  - First login after rollout adopts any pre-existing local preference values into
    the account.
- Constraints:
  - MongoDB via `getDatabase()` (`lib/db.ts`); server-only writes behind `withAuth`
    (`lib/middleware.ts`).
  - Must not bloat the hot, `no-store` `GET /api/auth/me` path — preferences load
    through a separate endpoint.
  - Preference payloads must be validated server-side against the schema and bounded
    in size; unknown keys rejected or ignored, never persisted verbatim.
  - Reuse `lib/offline/LocalStore.ts` versioned envelope and the storage telemetry
    seam (decision n020 — route storage events through one logging seam).
  - Anonymous (logged-out) users keep working with `localStorage`-only preferences.
  - TypeScript-strict repo with heavy typed interfaces and per-hook Jest suites;
    refactors must keep those suites green.
- Assumptions:
  - Preference set stays small (tens of keys), so an embedded sub-document on the
    `users` collection is acceptable rather than a separate collection.
  - Last-write-wins across devices/tabs is acceptable; no field-level merge needed.
  - A lost preference write (e.g. offline, never synced) is low-cost and does not
    require guaranteed delivery, though riding the existing `SyncQueue` is an option.
- Edge cases considered:
  - Storage unavailable / quota exceeded on the client (already handled defensively
    by `LocalStore` / `safeSet`).
  - Corrupt or stale-version stored preference blob (server and client both
    normalize to defaults on version mismatch).
  - Multiple tabs on one device (cross-tab `storage` event sync).
  - User with a local value AND a server value at first post-rollout login
    (conflict resolution rule required — see Open Questions).
  - Malformed PATCH body / non-object payload / unknown keys (reject before write,
    mirroring the feedback-API hardening decisions).
  - Preference schema growth over time (schema version + forward-compatible
    normalization).

## Scope

### In Scope

- Add a typed, versioned `Preferences` interface with explicit defaults and a
  `PREFERENCES_SCHEMA_VERSION`, plus `User.preferences?: Preferences`.
- Server persistence: read/write helpers for a user's preference sub-document in the
  `users` collection, going through the shared storage/telemetry seam.
- New API route `app/api/me/preferences/route.ts`: `GET` (resolved preferences =
  defaults merged with stored deltas) and `PATCH` (validated partial update,
  last-write-wins), both behind `withAuth`.
- Client `lib/preferences/` module: schema/defaults, a `PreferencesProvider` +
  `usePreferences()` hook that hydrates from the API on auth success, mirrors to
  `LocalStore`, exposes `setPreference`, and syncs across tabs via `storage` events.
- Refactor existing preference hooks (`useDiceFabPreferences`, `useDockState`) to
  read/write through `usePreferences()` while preserving their public hook APIs and
  `localStorage` mirroring for offline-first behavior.
- One-time adoption at first post-rollout login: if a preference is unset server-side
  but present in `localStorage`, push the local value up.
- A schema slot for a future dice/UI color preference (definition only — no color
  picker UI).
- Unit + integration tests for the schema/defaults, the API route (auth, validation,
  round-trip), the provider hydration/adoption/sync logic, and the refactored hooks.

### Out of Scope

- Any new preference-editing UI (settings page, color picker, options panel).
- Persisting campaigns, characters, rolls, or other first-class entities — they
  already have their own collections and APIs.
- Real-time multi-device preference push (SSE); staleness until next load is
  acceptable.
- Guaranteed-delivery / offline queue semantics for preference writes beyond
  best-effort (may be revisited if `SyncQueue` integration proves trivial).
- Server-driven feature flags or admin-managed defaults.
- Migrating `hpHistory` or chat-feed caches (they are transient data, not
  preferences).

## What Changes

- `lib/types.ts`: add `Preferences` interface and `User.preferences?: Preferences`.
- `lib/preferences/schema.ts` (new): `Preferences` shape, `DEFAULT_PREFERENCES`,
  `PREFERENCES_SCHEMA_VERSION`, `resolvePreferences(stored)`, `validatePreferencePatch(body)`.
- `lib/preferences/usePreferences.tsx` (new): `PreferencesProvider`, `usePreferences()`,
  `setPreference`, hydration-on-auth, `LocalStore` mirror, cross-tab `storage` sync.
- `lib/storage.ts` (or `lib/storage/*Repo.ts`): `getUserPreferences(userId)` /
  `updateUserPreferences(userId, patch)` through the storage-op/telemetry seam.
- `app/api/me/preferences/route.ts` (new): `GET` + `PATCH` behind `withAuth`.
- `app/` provider tree: mount `PreferencesProvider` under the auth boundary so it
  hydrates once per session.
- `lib/dice/useDiceFabPreferences.ts`, `lib/components/CampaignChat/useDockState.ts`:
  re-point storage reads/writes at `usePreferences()`; keep external hook signatures.
- Tests under `lib/preferences/__tests__/`, `app/api/me/preferences/__tests__/` (or
  the integration config), and updates to existing hook test suites.
- `openspec/changes/add-user-preference-persistence/` artifacts.
- `.wolf/anatomy.md` and `.wolf/memory.md` updated for new files (per project rules).

## Risks

- Risk: Refactoring `useDiceFabPreferences` / `useDockState` changes behavior or
  breaks their existing Jest suites.
  - Impact: Regressions in dice-fab and chat-dock UX; red CI.
  - Mitigation: Keep each hook's public API and `localStorage` key semantics stable;
    treat `usePreferences()` as the new backing store only. Update tests in the same
    change; add a provider test double.
- Risk: Loading preferences adds a request on every app start / auth check.
  - Impact: Extra latency and DB read at startup.
  - Mitigation: Separate endpoint hit once on auth success (not per route change);
    small projection; embedded sub-document means no extra collection lookup.
- Risk: Unvalidated PATCH payloads write arbitrary data into the user document.
  - Impact: Document bloat, malformed preferences, potential injection into
    downstream rendering.
  - Mitigation: Strict schema validation — reject non-object bodies before
    destructuring, allowlist known keys/paths, bound value sizes/types, ignore
    unknown keys (consistent with feedback-API hardening decisions n021/n022).
- Risk: First-login adoption overwrites a deliberate server value with a stale local
  one (or vice versa).
  - Impact: User sees an unexpected preference value once.
  - Mitigation: Adopt local → server only when the server side is unset for that key;
    otherwise server wins. Use `LocalStore` envelope `updatedAt` only as a tiebreak
    if a "newest wins" rule is chosen (see Open Questions).
- Risk: Schema evolution leaves old stored blobs on a prior version.
  - Impact: Missing/extra keys after a deploy.
  - Mitigation: `resolvePreferences` always merges stored deltas onto current
    defaults and drops unknown keys; `PREFERENCES_SCHEMA_VERSION` recorded with the
    stored document for future migrations.
- Risk: Cross-tab `storage` events cause update loops or thrash.
  - Impact: Excessive re-renders or redundant PATCHes.
  - Mitigation: Only react to the mirrored preferences key; diff before dispatch;
    debounce server writes; do not re-persist values received from a `storage` event.

## Open Questions

All four questions raised during exploration were resolved by the requester (@doug,
2026-08-31) in favour of the proposed defaults. No unresolved ambiguity remains.

- Resolved: First-login conflict rule — **server value wins**; a local value is
  adopted only when the server has no stored value for that key. ("Newest-wins" via
  `LocalStore` `updatedAt` was rejected.)
- Resolved: Preference writes use a **best-effort debounced PATCH** with an optimistic
  local mirror; `SyncQueue` integration is deferred (not in v1).
- Resolved: Storage location is an **embedded `preferences` sub-document on the
  `users` collection**; a dedicated `userPreferences` collection was rejected for v1.
- Resolved: v1 preference keys are exactly `dice.sendToChat`, `dice.disableAnimation`,
  `chat.pinned`, `chat.size`, plus a reserved `dice.color` slot. Nothing else is
  migrated now. `chat.size` keeps the dock's existing
  `{ height, screenWidth, screenHeight } | null` shape (not a bare number) so
  `useDockState` retains its viewport-change invalidation guard (@doug, 2026-08-31).

## Non-Goals

- Building a settings/preferences UI or a color picker.
- Persisting non-preference domain data (campaigns, characters, combat state).
- Real-time cross-device synchronization of preference changes.
- Admin- or server-managed default preferences / feature flags.
- Guaranteed delivery of preference writes.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
