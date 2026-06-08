## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

See also: [design](../../changes/archive/2026-06-07-player-invitations-inbox/design.md), [tasks](../../changes/archive/2026-06-07-player-invitations-inbox/tasks.md)

### Requirement: ADDED `Toast` component — success/error feedback

The system SHALL provide a reusable `useToast()` hook and `<Toast>` renderer in `lib/components/Toast.tsx` that displays a temporary message at a fixed bottom-right position and auto-dismisses after 3 seconds.

#### Scenario: Toast renders on showToast call

- **Given** a component has called `useToast()` and mounted `<Toast />`
- **When** `showToast("Joined campaign!", "success")` is called
- **Then** a visible element containing "Joined campaign!" is rendered with success styling (green)

#### Scenario: Toast auto-dismisses after 3 seconds

- **Given** a toast is visible
- **When** 3000ms elapses
- **Then** the toast element is no longer rendered

#### Scenario: Toast renders error variant

- **Given** a component has called `useToast()` and mounted `<Toast />`
- **When** `showToast("Something went wrong", "error")` is called
- **Then** a visible element containing "Something went wrong" is rendered with error styling (red)

---

### Requirement: ADDED NavBar invitation count badge

The system SHALL display a count pill link to `/invitations` in the NavBar when the authenticated user has one or more pending invitations.

#### Scenario: Badge shows count when invitations exist

- **Given** the user is authenticated
- **And** `GET /api/me/invitations` returns 2 pending invitations
- **When** the NavBar mounts
- **Then** a link labelled "Invitations (2)" with `href="/invitations"` is rendered

#### Scenario: Badge is hidden when no invitations

- **Given** the user is authenticated
- **And** `GET /api/me/invitations` returns an empty list
- **When** the NavBar mounts
- **Then** no "Invitations" link is rendered

#### Scenario: Badge is hidden when unauthenticated

- **Given** the user is not authenticated
- **When** the NavBar renders
- **Then** no "Invitations" link is rendered and no fetch to `/api/me/invitations` is made

#### Scenario: NavBar fetch failure does not break navigation

- **Given** the user is authenticated
- **And** `GET /api/me/invitations` throws a network error
- **When** the NavBar mounts
- **Then** the NavBar renders without crashing and no "Invitations" link is shown

---

### Requirement: ADDED `/invitations` inbox page

The system SHALL provide a `ProtectedRoute` page at `/invitations` that lists the authenticated user's pending campaign invitations.

#### Scenario: Inbox lists pending invitations

- **Given** the user is authenticated
- **And** `GET /api/me/invitations` returns `[{ id, campaignId, campaignName: "Lost Mine", invitedBy: "dm_alice", invitedAt: <timestamp> }]`
- **When** the user navigates to `/invitations`
- **Then** the page renders a row showing "Lost Mine", "dm_alice", and a relative time string (e.g., "2 days ago")

#### Scenario: Inbox shows empty state

- **Given** the user is authenticated
- **And** `GET /api/me/invitations` returns an empty list
- **When** the user navigates to `/invitations`
- **Then** the page renders a "No pending invitations" message and no invite rows

#### Scenario: Inbox shows loading state

- **Given** the user is authenticated
- **And** `GET /api/me/invitations` has not yet resolved
- **When** the page renders
- **Then** a loading indicator is shown

---

### Requirement: ADDED Accept invitation flow

The system SHALL allow an invited player to accept a campaign invitation from the inbox.

#### Scenario: Accept removes invite from list and shows toast

- **Given** the inbox displays a pending invitation for "Lost Mine of Phandelver"
- **When** the user clicks "Accept"
- **And** `PATCH /api/campaigns/[id]/members/me` with `{ action: "accept" }` succeeds
- **Then** the invite row is removed from the list immediately
- **And** a success toast containing "Joined" and "Lost Mine of Phandelver" is shown

#### Scenario: Accept failure shows error banner

- **Given** the inbox displays a pending invitation
- **When** the user clicks "Accept"
- **And** `PATCH /api/campaigns/[id]/members/me` returns a non-OK response
- **Then** an `ErrorBanner` is rendered with a relevant error message
- **And** the invite row remains in the list

---

### Requirement: ADDED Decline invitation flow

The system SHALL allow an invited player to decline a campaign invitation from the inbox.

#### Scenario: Decline removes invite from list and shows toast

- **Given** the inbox displays a pending invitation for "Curse of Strahd"
- **When** the user clicks "Decline"
- **And** `PATCH /api/campaigns/[id]/members/me` with `{ action: "decline" }` succeeds
- **Then** the invite row is removed from the list immediately
- **And** a success toast containing "Declined" and "Curse of Strahd" is shown

#### Scenario: Decline failure shows error banner

- **Given** the inbox displays a pending invitation
- **When** the user clicks "Decline"
- **And** `PATCH /api/campaigns/[id]/members/me` returns a non-OK response
- **Then** an `ErrorBanner` is rendered with a relevant error message
- **And** the invite row remains in the list

## MODIFIED Requirements

### Requirement: MODIFIED NavBar — authenticated nav link set

The NavBar SHALL conditionally render an "Invitations (N)" link when the authenticated user has pending invitations (N > 0).

#### Scenario: Invitations link appears alongside existing nav links

- **Given** the user is authenticated with 1 pending invitation
- **When** the NavBar mounts
- **Then** "Invitations (1)" is rendered as a link in the same nav row as Campaigns, Encounters, etc.

## REMOVED Requirements

None.

## Traceability

- Proposal: Standalone `Toast` component → Requirement: ADDED `Toast` component
- Proposal: NavBar count pill → Requirement: ADDED NavBar invitation count badge
- Proposal: `/invitations` inbox page → Requirement: ADDED `/invitations` inbox page
- Proposal: Accept flow → Requirement: ADDED Accept invitation flow
- Proposal: Decline flow → Requirement: ADDED Decline invitation flow
- Design Decision 1 (Toast.tsx) → Requirement: ADDED `Toast` component
- Design Decision 2 (NavBar fetch on mount) → Requirement: ADDED NavBar invitation count badge
- Design Decision 3 (optimistic removal) → Requirements: Accept flow, Decline flow
- Design Decision 4 (relative time) → Requirement: ADDED `/invitations` inbox page (invite row display)
- Design Decision 5 (hidden when 0) → Requirement: ADDED NavBar invitation count badge (hidden scenarios)
- All requirements → tasks.md (implementation tasks)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: NavBar invitation fetch does not delay initial render

- **Given** the user navigates to any page
- **When** the NavBar mounts
- **Then** all existing nav links (Campaigns, Encounters, etc.) are rendered immediately without waiting for the invitations fetch to resolve
- **And** the badge appears asynchronously once the fetch completes

### Requirement: Security

See functional scenarios: "Badge is hidden when unauthenticated", "NavBar fetch failure does not break navigation".

The invitations API itself is protected by `withAuth` middleware (existing, tested separately). No new access-control surface is introduced by the UI.

### Requirement: Reliability

#### Scenario: Inbox fetch failure shows error state

- **Given** the user is authenticated
- **And** `GET /api/me/invitations` returns a non-OK response
- **When** the user navigates to `/invitations`
- **Then** an `ErrorBanner` is rendered with an error message
- **And** no invite rows are shown
