# Profile Settings

## Purpose

Give authenticated users a single page (`/profile`, reached from the User Menu) to view
and edit their persisted preferences, and host the dice preference domain's `color`,
`surface`, and `material` controls — `/profile` is the sole UI surface for dice appearance.
The page binds directly to the offline-first `usePreferences` context, so
edits apply optimistically and sync to the server through the existing debounce/retry
path. Implementation: `app/profile/page.tsx`, `lib/components/UserMenu.tsx`,
`lib/preferences/schema.ts`, `lib/preferences/usePreferences.tsx`,
`app/api/me/preferences/route.ts`. Design rationale:
`openspec/changes/archive/2026-09-03-profile-settings/design.md` (original page/dice.color/
dice.surface addition),
`openspec/changes/archive/2026-09-26-consume-dice-preferences/design.md` (current
`dice.color`/`.surface`/`.material` shapes and engine wiring).

## Requirements

### Requirement: Profile Page

The system SHALL provide a profile settings page that allows authenticated users to view
and modify their preferences, including a toggle for `combat.autoScrollToNextCombatant`
presented alongside the existing dice and chat preference controls.

#### Scenario: Navigate to profile page

- **Given** an authenticated user is on any page with the navigation bar
- **When** they open the User Menu and click "Profile & Settings"
- **Then** they are navigated to the `/profile` route and see their current preferences.

#### Scenario: Edit dice preferences

- **Given** an authenticated user is on the `/profile` page
- **When** they toggle "Send rolls to chat", change the foreground/background color fields, or
  change the "Dice Surface"/"Dice Material" `<select>`s
- **Then** the `usePreferences` context updates immediately and syncs with the server.

#### Scenario: Edit combat auto-scroll preference

- **Given** an authenticated user is on the `/profile` page
- **When** they toggle "Auto-scroll to next combatant"
- **Then** the `usePreferences` context updates immediately and syncs with the server,
  matching the existing dice/chat toggle behavior.

#### Scenario: Access control

- **Given** an unauthenticated user
- **When** attempting to access the `/profile` route directly
- **Then** they are redirected to login by `<ProtectedRoute>`.

### Requirement: User Menu profile entry

The system SHALL display a "Profile & Settings" option in the User Menu, above "Logout".

#### Scenario: User Menu options

- **Given** an authenticated user clicks the User Menu trigger
- **When** the dropdown opens
- **Then** they see "Profile & Settings" above the "Logout" option.

### Requirement: Dice color and surface preferences

The system SHALL support `color`, `surface`, and `material` settings for the dice preference
domain. `dice.color` is `{ foreground: string; background: string } | null`, where each field
is a short hex string (`#rgb` / `#rrggbb`) and `null` means no custom color is set, with no
extra keys accepted on the object. `dice.surface` is a closed enum matching the dice engine's
real `theme_surface` keys (`DICE_SURFACE_VALUES` in `lib/preferences/schema.ts`: `default`,
`blue-felt`, `red-felt`, `green-felt`, `taverntable`, `mahogany`, `stainless`, `cyberpunk`,
`cagetown`), or `null` for the default surface. `dice.material` is
`'glass' | 'none' | 'metal' | 'wood' | null`, where `null` is the default material. This
supersedes the original `dice.surface: string | null` (unconstrained) and
`dice.color: string | null` (single hex) shapes — the original `wood`/`metal`/`stone`/`felt`
surface guess did not match the engine and is no longer valid.

#### Scenario: Save valid color preference

- **Given** a PATCH request to `/api/me/preferences` containing `dice.color` set to
  `{ foreground: "#000000", background: "#ff0000" }` or `null`
- **When** the server processes the request
- **Then** the preference is validated by `schema.ts`, accepted, and saved to the user's profile.

#### Scenario: Invalid dice color object is rejected

- **Given** a PATCH request to `/api/me/preferences` containing `dice.color` as a value that is
  not `null` and either is missing `foreground`/`background`, carries an extra key, or has a
  field that fails the hex-color pattern
- **When** the server processes the request
- **Then** `validatePreferencePatch` rejects the entire body with an error and no write occurs;
  no partial repair of just the invalid field is attempted.

#### Scenario: Save valid surface preference

- **Given** a PATCH request to `/api/me/preferences` containing `dice.surface` set to one of
  the `DICE_SURFACE_VALUES` members or `null`
- **When** the server processes the request
- **Then** the preference is validated by `schema.ts`, accepted, and saved to the user's
  profile.

#### Scenario: Reject unsupported surface value

- **Given** a PATCH request to `/api/me/preferences` containing a `dice.surface` value that is
  not a `DICE_SURFACE_VALUES` member or `null`
- **When** the server processes the request
- **Then** `validatePreferencePatch` rejects the body and no write occurs.

#### Scenario: Malformed stored dice preference degrades to default

- **Given** a stored preferences document whose `dice.color`, `dice.surface`, or `dice.material`
  value is malformed, of the wrong shape, or (for `surface`/`material`) not in the current enum
- **When** `resolvePreferences` merges the stored document onto defaults
- **Then** the affected key resolves to its default (`null`) rather than throwing, independently
  of any other valid keys in the same document.

#### Scenario: Save valid material preference

- **Given** a PATCH request to `/api/me/preferences` containing `dice.material` set to one of
  `glass`, `none`, `metal`, `wood`, or `null`
- **When** the server processes the request
- **Then** the preference is validated by `schema.ts`, accepted, and saved to the user's profile.

#### Scenario: Reject unsupported material value

- **Given** a PATCH request to `/api/me/preferences` containing a `dice.material` value that is
  not one of the four supported values or `null`
- **When** the server processes the request
- **Then** `validatePreferencePatch` rejects the body and no write occurs.

#### Scenario: Invalid dice colour input gives feedback and is not saved

- **Given** an authenticated user editing the foreground or background hex field on `/profile`
- **When** the current text is not a valid `#rgb` / `#rrggbb` hex string and is non-empty, or
  exactly one of the two fields is filled while the other is empty
- **Then** the affected field(s) show an invalid state (`aria-invalid` + a `role="alert"`
  helper) and `setPreference('dice.color', …)` is not called until both fields are valid and
  non-empty, or both are cleared.

### Requirement: Optimistic update latency

Preference edits on `/profile` SHALL apply to the UI without perceivable latency.

#### Scenario: Latency budget

- **Given** an authenticated user updating preferences
- **When** clicking a checkbox on `/profile`
- **Then** the UI updates optimistically, relying on the `usePreferences` debounce
  mechanism for the network request.

### Requirement: Sync failure recovery

A failed preference sync SHALL NOT lose the user's edit.

#### Scenario: Recovery behavior

- **Given** a network failure
- **When** the user changes a preference and the debounce fires
- **Then** `usePreferences` catches the error, retains the delta in its pending queue, and
  retries on the next render or sync attempt.
