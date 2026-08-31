## Context

- Relevant architecture:
  - Next.js App Router. MongoDB accessed server-side via `getDatabase()` (`lib/db.ts`).
  - Auth: JWT in an HTTP-only cookie; `AuthPayload` = `{ userId, email, tokenVersion }`
    (`lib/types.ts:298`). API routes wrap handlers with `withAuth` (`lib/middleware.ts`).
  - `GET /api/auth/me` (`app/api/auth/me/route.ts`) resolves `isAdmin` / `username`
    via `getUserById`; `Cache-Control: no-store`; refetched by `useAuth()` on mount
    and every route change (`lib/hooks/useAuth.ts`).
  - Client storage: `lib/offline/LocalStore.ts` — versioned envelope
    `{ v, data, updatedAt }`, key prefix `sessionCombat:v1:`. `logout()` clears
    `LocalStore`, `SyncQueue`, `clientStorage`.
  - Existing preference hooks: `lib/dice/useDiceFabPreferences.ts`,
    `lib/components/CampaignChat/useDockState.ts` — each pairs `safeGet`/`safeSet`
    over `LocalStore` with a `useReducer` `INIT` mount effect (decision n125).
  - Storage operations route through a shared op/telemetry seam
    (`lib/storage/runOp.ts`, decision n020).
- Dependencies: `mongodb` driver, existing `withAuth`, `getUserById` in
  `lib/permissions.ts`, `LocalStore`, React context in the App Router provider tree.
- Interfaces/contracts touched:
  - `User` interface (`lib/types.ts`) gains `preferences?`.
  - New HTTP contract: `GET`/`PATCH /api/me/preferences`.
  - New client contract: `PreferencesProvider` / `usePreferences()`.
  - Internal contract of `useDiceFabPreferences` / `useDockState` backing store
    (public hook return shapes unchanged).

## Goals / Non-Goals

### Goals

- Persist per-user preference deltas server-side, scoped to the authenticated user.
- One hydration path at auth success; one write path (`setPreference`).
- Keep offline-first behavior: `localStorage` remains a live mirror/cache.
- Preserve existing hook APIs and their test suites.
- Adopt pre-existing local preferences into the account on first post-rollout login.
- Provide a forward-compatible, versioned schema with a reserved color slot.

### Non-Goals

- Preference-editing UI, color picker, settings page.
- Persisting domain entities (campaigns, characters, combat).
- Real-time cross-device sync; guaranteed-delivery writes.
- Server-managed defaults / feature flags.

## Decisions

### Decision 1: Storage location — embedded `preferences` sub-document on `users`

- Chosen: Store a single `preferences` object on the existing `users` document:
  `{ schemaVersion: number, values: Partial<PreferenceValues>, updatedAt: Date }`.
  Only keys that differ from defaults are stored (sparse).
- Alternatives considered: dedicated `userPreferences` collection keyed by `userId`;
  storing preferences inside the JWT claims.
- Rationale: The set is small and bounded. `users` is already read at login-adjacent
  points. Atomic with the user record; no extra collection or index. JWT is signed
  and long-lived — unsuitable for mutable state.
- Trade-offs: `users` documents grow slightly; a very large future preference set
  would argue for splitting. Mitigated by the sparse-delta rule and size bounds; a
  later move to a separate collection is a contained migration.

### Decision 2: Dedicated `GET`/`PATCH /api/me/preferences` route, not folded into `/api/auth/me`

- Chosen: New route `app/api/me/preferences/route.ts` behind `withAuth`.
  `GET` returns fully-resolved preferences (defaults deep-merged with stored deltas)
  plus `schemaVersion`. `PATCH` accepts a partial `values` object, validates it,
  merges it into stored deltas, sets `updatedAt`, returns the resolved result.
- Alternatives considered: add `preferences` to the `/api/auth/me` payload.
- Rationale: `/api/auth/me` is `no-store` and re-fetched on every route change;
  adding preferences there multiplies reads and payload size. A separate endpoint is
  fetched once per session on auth success and can be revalidated deliberately.
- Trade-offs: One extra request at startup. Acceptable — small projection, embedded
  read, runs in parallel with other bootstrap fetches.

### Decision 3: Client `PreferencesProvider` + `usePreferences()` as the single backing store

- Chosen: `lib/preferences/usePreferences.tsx` exposes a context with
  `{ preferences, setPreference(path, value), ready }`. Mounted under the auth
  boundary in the App Router provider tree. On auth success it: (1) reads the
  `LocalStore` mirror for an instant first paint, (2) fetches `GET /api/me/preferences`,
  (3) reconciles (Decision 5), (4) writes the reconciled result back to the mirror.
  `setPreference` updates context state optimistically, writes the mirror, and
  schedules a debounced `PATCH`. A `storage` event listener syncs other tabs by
  re-reading the mirror and diffing before dispatch; values arriving via `storage`
  are not re-PATCHed.
- Alternatives considered: keep per-hook `LocalStore` access and add a separate
  sync layer; use a global store library.
- Rationale: One reconciliation point, one debounce, one telemetry seam. Existing
  hooks become thin adapters.
- Trade-offs: Provider must sit high in the tree and handle the logged-out case
  (no fetch; `localStorage`-only). Extra indirection for the existing hooks.

### Decision 4: Typed, versioned schema with resolve + validate helpers

- Chosen: `lib/preferences/schema.ts` defines `PreferenceValues` (typed, nested by
  domain: `dice`, `chat`), `DEFAULT_PREFERENCES`, `PREFERENCES_SCHEMA_VERSION`,
  `resolvePreferences(storedValues)` (deep-merge onto defaults, drop unknown keys,
  coerce/repair types, fall back per-key on invalid), and
  `validatePreferencePatch(body)` (reject non-object/array/null bodies before field
  access, allowlist known paths, enforce value type + bounds, strip unknown keys,
  return `{ ok, values } | { ok: false, error }`). v1 keys:
  `dice.sendToChat: boolean`, `dice.disableAnimation: boolean | null` (tri-state,
  `null` = follow `prefers-reduced-motion`), `chat.pinned: boolean`,
  `chat.size: number` (clamped to the dock's allowed range), and a reserved
  `dice.color: string | null` (default `null`, validated as a short hex string when
  present; no UI yet).
- Alternatives considered: free-form `Record<string, JSONValue>` bag.
- Rationale: Typed schema gives validation, bounded size, and an explicit migration
  story. Matches the repo's typed-interface conventions and the feedback-API input
  hardening decisions (n021 reject-before-destructure, n022 restrict/normalize).
- Trade-offs: Adding a preference key requires a schema edit (acceptable — it also
  forces a spec/test update).

### Decision 5: Reconciliation and first-login adoption

- Chosen: On hydrate, for each known key: if the server has a stored delta for that
  key, the server value wins and overwrites the mirror. If the server has no stored
  delta but the mirror (or a legacy per-hook `localStorage` key) holds a
  non-default value, treat it as "adopt": include it in a single `PATCH` that
  seeds the server, and keep it locally. Legacy keys
  (`sessionCombat:v1:dice-fab-send-to-chat`, `...dice-fab-disable-animation`,
  `...campaign-chat-pin`, `...campaign-chat-size`) are read once during adoption and
  then left untouched (the mirror becomes the source going forward).
- Alternatives considered: newest-wins using `LocalStore` envelope `updatedAt`;
  always-server-wins with no adoption.
- Rationale: Server-wins keeps multi-device behavior predictable; adoption prevents
  existing users from losing current settings on the first login after rollout.
- Trade-offs: A user who changed a preference on device B while device A was offline
  with an older explicit value will see device B's value win on next A load — the
  accepted last-write-wins consequence. "Newest-wins" remains an open question.

### Decision 6: Server persistence through the storage-op / telemetry seam

- Chosen: `getUserPreferences(userId)` and `updateUserPreferences(userId, patchValues)`
  live alongside the other storage helpers and execute through `runStorageOp`
  (or the equivalent seam) so preference reads/writes emit the same event shape as
  other storage operations. `updateUserPreferences` does a single
  `updateOne({ _id }, { $set: { 'preferences.values.<k>': v, ... 'preferences.updatedAt': now, 'preferences.schemaVersion': VERSION } })`.
- Alternatives considered: inline `db.collection('users').updateOne` in the route.
- Rationale: Decision n020 — one integration point for storage telemetry.
- Trade-offs: Slight indirection; consistent with existing repos.

## Proposal to Design Mapping

- Proposal element: Typed versioned `Preferences` with defaults + `User.preferences?`.
  - Design decision: Decision 1, Decision 4.
  - Validation approach: Unit tests for `resolvePreferences` / `validatePreferencePatch`
    (defaults, unknown-key drop, type repair, version mismatch); type-check of
    `User.preferences`.
- Proposal element: Server persistence via shared storage/telemetry seam.
  - Design decision: Decision 6.
  - Validation approach: Integration test asserting round-trip persist/read and that
    the op runs through the seam (telemetry hook invoked / spy).
- Proposal element: `GET`/`PATCH /api/me/preferences` behind `withAuth`.
  - Design decision: Decision 2.
  - Validation approach: Route tests — 401 unauthenticated; `GET` returns resolved
    defaults for a new user; `PATCH` valid partial persists and echoes resolved;
    `PATCH` invalid body → 400 with no write; unknown keys stripped.
- Proposal element: Client `lib/preferences/` provider + `usePreferences()` with
  hydrate-on-auth, mirror, cross-tab sync.
  - Design decision: Decision 3.
  - Validation approach: Provider tests with a mocked fetch and `localStorage`:
    hydration order, optimistic set + debounced PATCH, `storage` event sync without
    re-PATCH, logged-out `localStorage`-only path.
- Proposal element: Refactor `useDiceFabPreferences` / `useDockState` onto the
  provider, keep public APIs.
  - Design decision: Decision 3, Decision 5.
  - Validation approach: Existing hook suites stay green against a provider test
    wrapper; add tests that a change propagates to `setPreference`.
- Proposal element: First-login adoption of pre-existing local values.
  - Design decision: Decision 5.
  - Validation approach: Provider test — legacy key present + server unset → single
    seeding PATCH; server set → server wins, no PATCH.
- Proposal element: Reserved color preference slot.
  - Design decision: Decision 4.
  - Validation approach: Schema test — `dice.color` defaults to `null`, rejects
    non-hex strings, accepts a valid short hex.

## Functional Requirements Mapping

- Requirement: A user's non-default preferences persist server-side and survive
  logout and login on another device.
  - Design element: Decisions 1, 2, 6.
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Preferences
    persist across sessions and devices".
  - Testability notes: Integration test: PATCH as user, clear cookies, re-auth,
    GET returns the value.
- Requirement: Preferences load exactly once per authenticated session via a
  dedicated endpoint, not via `/api/auth/me`.
  - Design element: Decisions 2, 3.
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Preferences
    load on authentication".
  - Testability notes: Provider test asserts one `GET /api/me/preferences` per auth
    transition; `/api/auth/me` payload unchanged (snapshot/shape test).
- Requirement: `setPreference` updates UI immediately, mirrors to `localStorage`,
  and persists server-side (debounced, last-write-wins).
  - Design element: Decision 3.
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Changing a
    preference persists it".
  - Testability notes: Fake timers; assert optimistic state, mirror write, single
    debounced PATCH with the latest value after rapid changes.
- Requirement: Invalid or unknown preference input is rejected/stripped and never
  persisted.
  - Design element: Decision 4.
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Invalid
    preference updates are rejected".
  - Testability notes: Route + schema unit tests for non-object body, wrong types,
    out-of-range `chat.size`, unknown keys.
- Requirement: On first login after rollout, existing local preference values are
  adopted into the account without clobbering an existing server value.
  - Design element: Decision 5.
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Existing local
    preferences are adopted on first login".
  - Testability notes: Provider tests for the four legacy keys across server-set vs
    server-unset.
- Requirement: Existing dice-fab and chat-dock hooks behave identically to today
  from a consumer's perspective.
  - Design element: Decisions 3, 5.
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Existing
    preference hooks keep their contract".
  - Testability notes: Existing `useDiceFabPreferences` / `useDockState` suites pass
    unchanged (aside from wrapping in the provider).
- Requirement: Preference changes in one browser tab reflect in other open tabs.
  - Design element: Decision 3.
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Preferences
    sync across tabs".
  - Testability notes: Dispatch a synthetic `storage` event; assert context updates
    and no PATCH fires.
- Requirement: Logged-out users can still read/set preferences locally.
  - Design element: Decision 3.
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Anonymous
    users use local-only preferences".
  - Testability notes: Provider test with no auth: no fetch/PATCH, mirror still
    read/written.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: No added load on `GET /api/auth/me`; startup cost is one small
    extra request.
  - Design element: Decision 2 (separate endpoint, projection, embedded read).
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Preferences
    load on authentication" (delivery constraint).
  - Testability notes: Assert `/api/auth/me` response shape unchanged; assert
    preferences fetch is a single request; projection limits returned fields.
- Requirement category: security
  - Requirement: All preference reads/writes require an authenticated session and
    are scoped to that user; payloads are validated before any write.
  - Design element: `withAuth` wrapper; Decision 4 validation; `_id`-scoped update.
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Invalid
    preference updates are rejected" + "Preferences are scoped to the authenticated
    user".
  - Testability notes: 401 test; test that user A's PATCH cannot affect user B;
    reject-before-destructure test.
- Requirement category: reliability
  - Requirement: Client degrades gracefully when storage or the network is
    unavailable (in-session values, logged warnings, no throw).
  - Design element: Reuse `safeGet`/`safeSet` semantics from `LocalStore`; PATCH
    failures logged and retried on next `setPreference` / reload, not surfaced as
    errors.
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Preference
    persistence degrades gracefully".
  - Testability notes: Mock `localStorage` throwing; mock fetch rejecting; assert no
    unhandled error and UI still updates.
- Requirement category: operability
  - Requirement: Preference storage operations emit the same telemetry event shape
    as other storage operations.
  - Design element: Decision 6 (storage-op seam).
  - Acceptance criteria reference: `specs/user-preferences/spec.md` — "Preference
    storage operations are observable".
  - Testability notes: Spy on the storage-op seam; assert invocation with an
    operation label for get/update.

## Risks / Trade-offs

- Risk/trade-off: Refactoring `useDiceFabPreferences` / `useDockState`.
  - Impact: UX regression in dice fab / chat dock; broken suites.
  - Mitigation: Keep public hook signatures and `localStorage` key semantics;
    provider is only the new backing store; update tests in-change; add a provider
    test wrapper util.
- Risk/trade-off: Server-wins reconciliation can surprise a user with a stale local
  explicit value.
  - Impact: One unexpected preference value after a cross-device change.
  - Mitigation: Documented last-write-wins; "newest-wins" left as an open question
    with `updatedAt` already available if chosen.
- Risk/trade-off: `users` document growth.
  - Impact: Marginally larger user reads.
  - Mitigation: Sparse deltas only; per-value type/size bounds; schema review gate
    when adding keys.
- Risk/trade-off: Cross-tab sync loops.
  - Impact: Redundant renders/PATCHes.
  - Mitigation: Diff before dispatch; never re-PATCH values received via `storage`;
    debounce writes.
- Risk/trade-off: Extra startup request.
  - Impact: Minor latency.
  - Mitigation: Fire in parallel with other bootstrap fetches; instant first paint
    from the mirror.

## Rollback / Mitigation

- Rollback trigger: Preference persistence causes auth/startup errors, data
  corruption in `users`, or regressions in dice-fab / chat-dock behavior that cannot
  be hot-fixed.
- Rollback steps:
  1. Revert the change branch (feature is additive: new route, new module, hook
     internals). Reverting restores the previous per-hook `LocalStore` access.
  2. The `/api/me/preferences` route and `PreferencesProvider` are removed with the
     revert; the legacy `localStorage` keys were never deleted, so existing local
     preferences are still intact.
  3. Leave any written `preferences` sub-documents in place (ignored by reverted
     code) or run a one-off `$unset` cleanup if desired.
- Data migration considerations: No destructive migration. Adding `preferences` is
  additive; legacy keys are read-only during adoption and never removed. A cleanup
  `$unset` of `users.preferences` is optional and safe.
- Verification after rollback: Auth flow and app startup succeed; dice-fab toggles
  and chat-dock pin/size persist across reload via the legacy keys; existing hook
  suites pass on the reverted tree.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix forward on the change branch; re-run
  `ci-gate` and the full test suite. If a failure is a pre-existing flake unrelated
  to this change, note it in the PR and rerun; do not `--admin` merge (memory:
  no-admin-merge-bypass).
- If security checks fail: Treat Codacy / security-review findings on the new route
  or schema as blocking. Address input-validation and auth-scoping findings before
  merge; no suppression without an explicit, reviewed justification.
- If required reviews are blocked/stale: Request a fresh review; address every PR
  comment and resolve threads before merge (memory: resolve-pr-comments). `main` is
  a squash-only ruleset with `ci-gate` + Codacy required and 0 approvals — still
  wait for human review on a change of this surface area.
- Escalation path and timeout: If checks remain blocked > 1 working day, escalate to
  @doug with the failing check names and logs; pause apply until resolved. Never
  push directly to protected branches (memory: no-branch-protection-bypass).

## Open Questions

All open questions were resolved by @doug on 2026-08-31; the decisions above are final
for v1.

- Resolved — First-login conflict rule: **server value wins**; local values adopted
  only for keys with no stored server value (Decision 5). "Newest-wins" rejected.
- Resolved — Write durability: **best-effort debounced PATCH** with optimistic local
  mirror; `SyncQueue` integration deferred (Decision 3).
- Resolved — Storage location: **embedded `preferences` sub-document on `users`**
  (Decision 1); dedicated collection rejected for v1.
- Resolved — v1 key set: `dice.sendToChat`, `dice.disableAnimation`, `chat.pinned`,
  `chat.size`, reserved `dice.color`; nothing else migrated (Decision 4).
