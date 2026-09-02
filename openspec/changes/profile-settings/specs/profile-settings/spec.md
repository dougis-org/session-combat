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

#### Scenario: Save valid surface preference

- **Given** a PATCH request to `/api/me/preferences` containing a new valid `dice.surface` string
- **When** the server processes the request
- **Then** the preference is validated by `schema.ts`, accepted, and saved to the user's profile.

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
