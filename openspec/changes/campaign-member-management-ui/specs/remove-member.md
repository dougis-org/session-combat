## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED DM can remove an active or invited member (soft-delete)

The system SHALL expose `DELETE /api/campaigns/[id]/members/[userId]` which sets the target member's status to `"removed"`, and SHALL render a Remove button for each eligible member row on the campaign home page.

#### Scenario: DM removes an active member

- **Given** the current user is the DM and a player with `status: "active"` exists in the campaign
- **When** the DM calls `DELETE /api/campaigns/[id]/members/[userId]`
- **Then** the response is `200`, the member's `status` in the database is `"removed"`, and the UI refreshes the member list

#### Scenario: DM removes an invited member

- **Given** a member with `status: "invited"` in the campaign
- **When** the DM calls `DELETE /api/campaigns/[id]/members/[userId]`
- **Then** the response is `200` and the member's status becomes `"removed"`

#### Scenario: Non-DM cannot remove a member

- **Given** the current user has `role: "player"`
- **When** they call `DELETE /api/campaigns/[id]/members/[userId]`
- **Then** the response is `403 Forbidden`

#### Scenario: DM cannot remove themselves

- **Given** the DM attempts to remove their own `userId`
- **When** `DELETE /api/campaigns/[id]/members/[ownUserId]` is called
- **Then** the response is `400 Bad Request`; the UI does not show a Remove button on the DM's own row

#### Scenario: Attempting to remove a non-existent or already-removed member

- **Given** the target `userId` does not exist in the campaign, or has `status: "removed"` or `"declined"`
- **When** `DELETE /api/campaigns/[id]/members/[userId]` is called
- **Then** the response is `404 Not Found`

#### Scenario: UI hides Remove button on DM's own row

- **Given** the campaign home page is rendered and the current user is the DM
- **When** the member list is displayed
- **Then** the DM's own row has no Remove button; all other active/invited member rows do

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Remove-member (status `removed`)" → Requirement: DM can remove a member
- Design decision 3 (DELETE verb) → Scenario: DM removes active/invited member
- Design decision 4 (remove guards) → Scenario: Non-DM blocked, DM self-remove blocked, 404 on missing
- Requirement → Tasks: task-4 (DELETE API), task-5 (UI Remove button)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Only DM can trigger removal

- **Given** a request with a valid player-role auth token
- **When** `DELETE /api/campaigns/[id]/members/[userId]` is called
- **Then** `403` is returned and the target member's status is unchanged

### Requirement: Reliability

#### Scenario: Soft-delete does not destroy data

- **Given** a member is removed via DELETE
- **When** the database is inspected
- **Then** the `CampaignMember` document still exists with `status: "removed"`; no document was deleted
