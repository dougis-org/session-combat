## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Profile Page

The system SHALL provide a profile settings page that allows authenticated users to view and modify their preferences.

#### Scenario: Navigate to profile page

- **Given** an authenticated user is on any page with the navigation bar
- **When** they open the User Menu and click "Profile & Settings"
- **Then** they are navigated to the `/profile` route and see their current preferences.

#### Scenario: Edit dice preferences

- **Given** an authenticated user is on the `/profile` page
- **When** they toggle "Send rolls to chat" or change the "Dice Surface" setting
- **Then** the `usePreferences` context updates immediately and syncs with the server.

### Requirement: ADDED schema settings

The system SHALL support `color` and `surface` settings for the dice preference domain.
`dice.surface` is `string | null`, where `null` is the default surface and the supported
non-null values are `wood`, `metal`, `stone`, and `felt`. `dice.color` is a short hex
string (`#rgb` / `#rrggbb`) or `null`.

#### Scenario: Save valid surface preference

- **Given** a PATCH request to `/api/me/preferences` containing `dice.surface` set to one of
  the supported values (`wood`, `metal`, `stone`, `felt`) or `null`
- **When** the server processes the request
- **Then** the preference is validated by `schema.ts`, accepted, and saved to the user's profile.

#### Scenario: Reject unsupported surface value

- **Given** a PATCH request to `/api/me/preferences` containing a `dice.surface` string that
  is not one of the supported values
- **When** the server processes the request
- **Then** `validatePreferencePatch` rejects the body and no write occurs, and
  `resolvePreferences` repairs a stored out-of-range value back to `null`.

#### Scenario: Invalid dice colour input gives feedback and is not saved

- **Given** an authenticated user editing the "Dice Color" field on `/profile`
- **When** the current text is not a valid `#rgb` / `#rrggbb` hex string and is non-empty
- **Then** the field shows an invalid state (visible indicator + helper text) and
  `setPreference('dice.color', …)` is not called until the value is valid or cleared.

## MODIFIED Requirements

### Requirement: MODIFIED User Menu

The system SHALL display a "Profile & Settings" option in the User Menu.

#### Scenario: User Menu Options

- **Given** an authenticated user clicks the User Menu trigger
- **When** the dropdown opens
- **Then** they see "Profile & Settings" above the "Logout" option.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Add "Profile & Settings" link -> MODIFIED User Menu
- Design decision -> Requirement: Flat page at `app/profile/page.tsx` -> ADDED Profile Page
- Requirement -> Task(s): Update `schema.ts` to include `surface` -> ADDED schema settings
- Design Decision 3 -> Requirement: `dice.surface` enum (`wood`/`metal`/`stone`/`felt`/`null`) -> ADDED schema settings (follow-up: schema enum enforcement)
- Design Decision 4 -> Note: `dice.color` / `dice.surface` persisted only, not consumed by the dice engine in this change
- Design Risk -> Requirement: invalid `dice.color` input feedback -> ADDED schema settings (follow-up: inline colour-field validation)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above.

### Requirement: Performance

#### Scenario: Latency budget

- **Given** an authenticated user updating preferences
- **When** clicking a checkbox on `/profile`
- **Then** the UI updates optimistically with zero perceivable latency, relying on the `usePreferences` debounce mechanism for the network request.

### Requirement: Security

> See functional scenarios for access control.

#### Scenario: Access control

- **Given** an unauthenticated user
- **When** attempting to access the `/profile` route directly
- **Then** they are redirected to login by `<ProtectedRoute>`.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a network failure
- **When** the user changes a preference and the debounce fires
- **Then** `usePreferences` catches the error, retains the delta in its pending queue, and retries on the next render or sync attempt.
