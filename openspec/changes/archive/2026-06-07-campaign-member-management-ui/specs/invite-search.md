## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED DM can search for users and invite them to a campaign

The system SHALL allow a DM to type a username prefix into a search box, see matching users, and invite a selected user by calling the existing invite API.

#### Scenario: DM searches and sees matching results

- **Given** the current user is the DM and at least one other user exists with a matching username prefix
- **When** the DM types 1 or more characters into the search box
- **Then** within 300ms + debounce, a dropdown appears with matching usernames

#### Scenario: DM invites a user from search results

- **Given** the search results dropdown is showing a candidate user
- **When** the DM clicks "Invite" next to that user
- **Then** `POST /api/campaigns/[id]/members` is called with the candidate's `userId`, the search box clears, and the member list refreshes to include the newly invited member with `status: "invited"`

#### Scenario: Inviting an already-active or already-invited member shows an error

- **Given** the DM searches for a username that is already an active or invited member
- **When** the DM clicks "Invite"
- **Then** the API returns `409` and an inline error message is displayed; the member list is not changed

#### Scenario: Empty search query produces no results

- **Given** the search box is empty or contains only whitespace
- **When** the component evaluates the input
- **Then** no API call is made and the results dropdown is not shown

#### Scenario: Non-DM cannot see the invite section

- **Given** the current user has `role: "player"`
- **When** the campaign home page renders
- **Then** the search box and invite controls are not present in the DOM

#### Scenario: Re-inviting a previously removed or declined member succeeds

- **Given** a user was previously `removed` or `declined` from the campaign
- **When** the DM searches for and invites them again
- **Then** the API returns `201`, the member's status is reset to `invited`, and they appear in the member list with an invited badge

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Username search box + invite action" → Requirement: DM can search and invite
- Design decision 6 (debounce) → Scenario: DM searches and sees matching results
- Design decision 4 (remove guards, analogous invite guards) → Scenario: Already-active/invited error
- Requirement → Tasks: task-5 (UI InviteSection), task-3 (GET members for list refresh)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Non-DM cannot invite

- **Given** the current user has `role: "player"` in the campaign
- **When** they attempt `POST /api/campaigns/[id]/members` (even directly via API)
- **Then** the response is `403 Forbidden`

### Requirement: Reliability

#### Scenario: Search API failure degrades gracefully

- **Given** `GET /api/users/search` returns a non-200 response
- **When** the DM is typing in the search box
- **Then** the results dropdown is not shown and no unhandled error is thrown
