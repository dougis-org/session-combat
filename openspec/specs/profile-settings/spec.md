# Profile Settings

## Purpose

Give authenticated users a single page (`/profile`, reached from the User Menu) to view
and edit their persisted preferences, and extend the dice preference domain with `color`
and `surface`. The page binds directly to the offline-first `usePreferences` context, so
edits apply optimistically and sync to the server through the existing debounce/retry
path. Implementation: `app/profile/page.tsx`, `lib/components/UserMenu.tsx`,
`lib/preferences/schema.ts`, `lib/preferences/usePreferences.tsx`,
`app/api/me/preferences/route.ts`. Design rationale:
`openspec/changes/archive/2026-09-03-profile-settings/design.md`.

## Requirements

### Requirement: Profile Page

The system SHALL provide a profile settings page that allows authenticated users to view
and modify their preferences.

#### Scenario: Navigate to profile page

- **Given** an authenticated user is on any page with the navigation bar
- **When** they open the User Menu and click "Profile & Settings"
- **Then** they are navigated to the `/profile` route and see their current preferences.

#### Scenario: Edit dice preferences

- **Given** an authenticated user is on the `/profile` page
- **When** they toggle "Send rolls to chat" or change the "Dice Surface" setting
- **Then** the `usePreferences` context updates immediately and syncs with the server.

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

The system SHALL support `color` and `surface` settings for the dice preference domain.
`dice.surface` is `string | null`, where `null` is the default surface and the supported
non-null values are `wood`, `metal`, `stone`, and `felt`. `dice.color` is a short hex
string (`#rgb` / `#rrggbb`) or `null`.

#### Scenario: Save valid surface preference

- **Given** a PATCH request to `/api/me/preferences` containing `dice.surface` set to one of
  the supported values (`wood`, `metal`, `stone`, `felt`) or `null`
- **When** the server processes the request
- **Then** the preference is validated by `schema.ts`, accepted, and saved to the user's
  profile.

#### Scenario: Reject unsupported surface value

- **Given** a PATCH request to `/api/me/preferences` containing a `dice.surface` string that
  is not one of the supported values
- **When** the server processes the request
- **Then** `validatePreferencePatch` rejects the body and no write occurs, and
  `resolvePreferences` repairs a stored out-of-range value back to `null`.

> Note: as of the initial implementation `dice.surface` is validated as any `string | null`;
> enum enforcement of the four supported values is a tracked follow-up (design.md Decision 3).

#### Scenario: Invalid dice colour input gives feedback and is not saved

- **Given** an authenticated user editing the "Dice Color" field on `/profile`
- **When** the current text is not a valid `#rgb` / `#rrggbb` hex string and is non-empty
- **Then** the field shows an invalid state (`aria-invalid` + a `role="alert"` helper) and
  `setPreference('dice.color', …)` is not called until the value is valid or cleared.

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
