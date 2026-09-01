## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Preferences persist across sessions and devices

The system SHALL persist each authenticated user's non-default preference values in a
server-side `preferences` sub-document on that user's record, storing only values that
differ from the schema defaults, so the values are available on any later session or
device.

#### Scenario: Preference survives logout and re-login on another device

- **Given** an authenticated user who has set `dice.sendToChat` to `true`
- **When** the user logs out, clears local browser storage, and logs in again from a
  different browser
- **Then** `GET /api/me/preferences` returns `dice.sendToChat` as `true` and the
  dice-fab reflects that value on first render

#### Scenario: Only non-default values are stored

- **Given** a user whose only non-default preference is `chat.size` (a dock-size object
  `{ height, screenWidth, screenHeight }`)
- **When** the stored preference document is inspected
- **Then** `preferences.values` contains `chat.size` and does not contain any key
  whose value equals the schema default

### Requirement: ADDED Preferences load on authentication

The system SHALL load the authenticated user's resolved preferences exactly once per
authenticated session through the dedicated `GET /api/me/preferences` endpoint, and
SHALL NOT include preference data in the `GET /api/auth/me` response.

#### Scenario: Single preference fetch on auth success

- **Given** a user completing login
- **When** the client establishes the authenticated session
- **Then** the client issues exactly one `GET /api/me/preferences` request and does not
  re-fetch preferences on subsequent client-side route changes

#### Scenario: auth/me payload unchanged

- **Given** an authenticated request to `GET /api/auth/me`
- **When** the response is returned
- **Then** the response body contains only `authenticated`, `userId`, `email`,
  `isAdmin`, and `username` and contains no preference fields

#### Scenario: New user receives resolved defaults

- **Given** an authenticated user who has never set a preference
- **When** the client requests `GET /api/me/preferences`
- **Then** the response is the full set of schema defaults with the current
  `schemaVersion` and HTTP status 200

### Requirement: ADDED Changing a preference persists it

The system SHALL, when a preference is changed through `setPreference`, update the
in-memory value immediately, write the value to the local storage mirror, and persist
the change to the server via a debounced `PATCH /api/me/preferences` using
last-write-wins semantics.

#### Scenario: Optimistic update and debounced persistence

- **Given** an authenticated user viewing a control bound to `dice.disableAnimation`
- **When** the user toggles the control and no further change occurs within the debounce
  window
- **Then** the UI reflects the new value synchronously, the local storage mirror
  contains the new value, and exactly one `PATCH /api/me/preferences` is sent carrying
  that value

#### Scenario: Rapid consecutive changes coalesce

- **Given** an authenticated user
- **When** the user changes `chat.size` three times within the debounce window
- **Then** exactly one `PATCH /api/me/preferences` is sent and it carries the final
  value

#### Scenario: Server stores the merged delta

- **Given** a user with stored `preferences.values = { dice: { sendToChat: true } }`
- **When** a valid `PATCH` sets `chat.pinned = true`
- **Then** the stored `preferences.values` becomes
  `{ dice: { sendToChat: true }, chat: { pinned: true } }`, `preferences.updatedAt` is
  advanced, and `preferences.schemaVersion` equals the current schema version

### Requirement: ADDED Invalid preference updates are rejected

The system SHALL validate every `PATCH /api/me/preferences` body against the preference
schema before any write, rejecting non-object bodies and out-of-range or wrongly-typed
values, and stripping unknown keys, so that no invalid or unknown data is persisted.

#### Scenario: Non-object body is rejected

- **Given** an authenticated user
- **When** the client sends `PATCH /api/me/preferences` with a JSON array, string,
  `null`, or malformed JSON as the body
- **Then** the response is HTTP 400, the error names the validation failure, and the
  stored preference document is unchanged

#### Scenario: Wrongly-typed value is rejected

- **Given** an authenticated user
- **When** the client sends `PATCH` with `chat.size` set to `"large"` (not a dock-size
  object) or `dice.sendToChat` set to `1`
- **Then** the response is HTTP 400 and no field is written

#### Scenario: Out-of-range value is rejected

- **Given** an authenticated user and a bounded dock height range (`DOCK_MIN_HEIGHT`..
  `DOCK_MAX_HEIGHT`)
- **When** the client sends `PATCH` with a `chat.size` whose `height` is outside that
  range, or whose shape is not `{ height, screenWidth, screenHeight }`
- **Then** the response is HTTP 400 and no field is written

#### Scenario: Unknown keys are stripped

- **Given** an authenticated user
- **When** the client sends `PATCH` with `{ dice: { sendToChat: true }, bogusKey: 5 }`
- **Then** the response is HTTP 200, `dice.sendToChat` is persisted, and `bogusKey` is
  not present in the stored document

### Requirement: ADDED Existing local preferences are adopted on first login

The system SHALL, on the first authenticated hydration after this feature is deployed,
seed the server preference document from any pre-existing non-default local values
(including legacy per-hook `localStorage` keys) for keys that have no stored server
value, and SHALL NOT overwrite any key that already has a stored server value.

#### Scenario: Local value adopted when server is unset

- **Given** a user with legacy local key `sessionCombat:v1:dice-fab-send-to-chat` set to
  `true` and no server-stored `dice.sendToChat`
- **When** the client hydrates preferences after login
- **Then** a single `PATCH /api/me/preferences` seeds `dice.sendToChat = true` and the
  resolved preference value is `true`

#### Scenario: Server value wins over a stale local value

- **Given** a user with local `dice.sendToChat = true` and server-stored
  `dice.sendToChat = false`
- **When** the client hydrates preferences after login
- **Then** the resolved value is `false`, the local mirror is updated to `false`, and no
  seeding `PATCH` is sent for that key

### Requirement: ADDED Existing preference hooks keep their contract

The system SHALL keep the public return shapes and observable behavior of
`useDiceFabPreferences` and `useDockState` unchanged while re-pointing their backing
store to the preferences provider.

#### Scenario: Dice-fab hook behavior preserved

- **Given** a component using `useDiceFabPreferences` rendered within the preferences
  provider
- **When** the component reads and updates `sendToChat` and `disableAnimation`
- **Then** the hook returns the same fields with the same semantics as before (including
  the `disableAnimation` tri-state fallback to `prefers-reduced-motion`) and updates
  route through `setPreference`

#### Scenario: Dock-state hook behavior preserved

- **Given** a component using `useDockState` rendered within the preferences provider
- **When** the component reads and updates the pin and size values
- **Then** the hook returns the same fields with the same semantics as before and
  updates route through `setPreference`

### Requirement: ADDED Preferences sync across tabs

The system SHALL propagate a preference change made in one browser tab to other open
tabs of the same origin via the storage mirror, without issuing an additional server
`PATCH` from the receiving tabs.

#### Scenario: Second tab observes a change

- **Given** two tabs of the app open for the same authenticated user
- **When** tab A changes `chat.pinned`
- **Then** tab B's `usePreferences()` value for `chat.pinned` updates to match and tab B
  sends no `PATCH /api/me/preferences`

### Requirement: ADDED Anonymous users use local-only preferences

The system SHALL allow unauthenticated users to read and change preferences using only
the local storage mirror, issuing no `GET` or `PATCH` to `/api/me/preferences`.

#### Scenario: Logged-out user toggles a preference

- **Given** an unauthenticated visitor
- **When** the visitor changes `dice.disableAnimation`
- **Then** the value is written to the local storage mirror, the UI updates, and no
  request to `/api/me/preferences` is made

### Requirement: ADDED Preference persistence degrades gracefully

The system SHALL keep the application functional when the local storage mirror or the
network is unavailable, applying changes in-session, logging the failure, and never
throwing to the caller.

#### Scenario: Local storage unavailable

- **Given** a browser where `localStorage` access throws
- **When** the user changes a preference
- **Then** the in-memory value updates, a warning is logged, and no error propagates to
  the UI

#### Scenario: Preference PATCH fails

- **Given** an authenticated user whose `PATCH /api/me/preferences` request fails
- **When** the user changes a preference
- **Then** the in-memory and mirrored values still update, the failure is logged, and
  the change is retried on the next `setPreference` or the next hydration

## MODIFIED Requirements

### Requirement: MODIFIED User model carries optional preferences

The system SHALL represent a user with an optional `preferences` sub-document of shape
`{ schemaVersion: number, values: Partial<PreferenceValues>, updatedAt: Date }`, absent
for users who have never set a preference.

#### Scenario: User without preferences

- **Given** a user document with no `preferences` field
- **When** the user is loaded server-side
- **Then** the load succeeds and preference resolution yields the full schema defaults

## REMOVED Requirements

None.

## Traceability

- Proposal element "Typed versioned Preferences + `User.preferences?`" -> Requirement:
  ADDED "Preferences persist across sessions and devices", MODIFIED "User model carries
  optional preferences".
- Proposal element "Single client load path at login" -> Requirement: ADDED
  "Preferences load on authentication".
- Proposal element "Single write path `setPreference`" -> Requirement: ADDED "Changing a
  preference persists it".
- Proposal element "Server-side validation, bounded size, unknown keys rejected" ->
  Requirement: ADDED "Invalid preference updates are rejected".
- Proposal element "One-time adoption at first post-rollout login" -> Requirement: ADDED
  "Existing local preferences are adopted on first login".
- Proposal element "Refactor existing hooks, preserve public APIs" -> Requirement: ADDED
  "Existing preference hooks keep their contract".
- Proposal element "Cross-tab sync via `storage` events" -> Requirement: ADDED
  "Preferences sync across tabs".
- Proposal element "Anonymous users keep working with local-only preferences" ->
  Requirement: ADDED "Anonymous users use local-only preferences".
- Proposal element "Reuse LocalStore defensive semantics / storage telemetry seam" ->
  Requirement: ADDED "Preference persistence degrades gracefully", NFAC Operability.
- Design Decision 1 (embedded sub-document) -> Requirement: MODIFIED "User model carries
  optional preferences", ADDED "Preferences persist across sessions and devices".
- Design Decision 2 (dedicated endpoint) -> Requirement: ADDED "Preferences load on
  authentication", NFAC Performance.
- Design Decision 3 (provider) -> Requirement: ADDED "Changing a preference persists
  it", "Preferences sync across tabs", "Anonymous users use local-only preferences",
  "Existing preference hooks keep their contract".
- Design Decision 4 (schema + validate/resolve) -> Requirement: ADDED "Invalid
  preference updates are rejected".
- Design Decision 5 (reconciliation + adoption) -> Requirement: ADDED "Existing local
  preferences are adopted on first login".
- Design Decision 6 (storage-op seam) -> Requirement: NFAC Operability.
- Requirement "Preferences persist across sessions and devices" -> Tasks: schema,
  User type, storage helpers, GET/PATCH route.
- Requirement "Preferences load on authentication" -> Tasks: GET route, provider
  hydration, provider mount.
- Requirement "Changing a preference persists it" -> Tasks: provider `setPreference` +
  debounce, PATCH route.
- Requirement "Invalid preference updates are rejected" -> Tasks: `validatePreferencePatch`,
  PATCH route validation.
- Requirement "Existing local preferences are adopted on first login" -> Tasks: provider
  reconciliation/adoption logic.
- Requirement "Existing preference hooks keep their contract" -> Tasks: refactor
  `useDiceFabPreferences`, refactor `useDockState`.
- Requirement "Preferences sync across tabs" -> Tasks: provider `storage` listener.
- Requirement "Anonymous users use local-only preferences" -> Tasks: provider
  logged-out path.
- Requirement "Preference persistence degrades gracefully" -> Tasks: provider
  safe read/write + PATCH error handling.
- Requirement "User model carries optional preferences" -> Tasks: `lib/types.ts` update.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Startup preference load cost

- **Given** an authenticated client bootstrapping the app
- **When** the session becomes authenticated
- **Then** preferences are loaded with exactly one additional HTTP request beyond the
  existing bootstrap requests, that request runs concurrently with other bootstrap
  fetches, and the `users` read uses a projection limited to the `preferences` field
  plus fields already required by the auth path

#### Scenario: First paint does not wait on the network

- **Given** a returning authenticated user with a populated local storage mirror
- **When** the app renders before `GET /api/me/preferences` resolves
- **Then** preference-bound UI renders immediately from the mirror and reconciles when
  the fetch completes

### Requirement: Security

- Access control for reading and writing preferences, unauthenticated rejection, and
  rejection of invalid payloads are fully specified by the functional scenarios. See
  functional scenarios: "New user receives resolved defaults", "Single preference fetch
  on auth success", "Non-object body is rejected", "Wrongly-typed value is rejected",
  "Out-of-range value is rejected", "Unknown keys are stripped", "Logged-out user
  toggles a preference".

#### Scenario: Preferences are scoped to the authenticated user

- **Given** authenticated user A and authenticated user B
- **When** user A sends `PATCH /api/me/preferences`
- **Then** only user A's preference document is modified and user B's document is
  unchanged, because the update is keyed by the session's user id and the request body
  carries no user identifier

#### Scenario: Stored preference values cannot inject markup downstream

- **Given** a `PATCH` whose string-typed preference value (e.g. `dice.color`) contains
  markup or control characters
- **When** the value is validated
- **Then** it is rejected unless it matches the constrained format for that key (e.g. a
  short hex color), so no unconstrained string is persisted

### Requirement: Reliability

#### Scenario: Recovery behavior after a failed sync

- **Given** an authenticated user whose earlier preference `PATCH` failed and left the
  server value behind the local value
- **When** the client next hydrates or the user changes any preference
- **Then** the pending local delta is re-sent and the server converges to the local
  value, with no user-visible error

#### Scenario: Corrupt or stale-version stored data

- **Given** a stored `preferences` document whose `schemaVersion` is older than the
  current version or whose `values` contain unknown or wrongly-typed keys
- **When** preferences are resolved on the server or client
- **Then** resolution returns current defaults merged with only the valid known deltas,
  and no error is raised

### Requirement: Operability

#### Scenario: Preference storage operations are observable

- **Given** the shared storage-operation telemetry seam
- **When** `getUserPreferences` or `updateUserPreferences` executes
- **Then** the seam is invoked with an operation label identifying the preference read
  or write, using the same event shape as other storage operations
