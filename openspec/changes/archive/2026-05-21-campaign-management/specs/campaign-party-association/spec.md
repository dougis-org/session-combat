## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Party can be associated with a campaign

The system SHALL allow a party to carry an optional `campaignId` reference to a campaign owned by the same user.

#### Scenario: Creating a party with a campaignId

- **Given** an authenticated user with an existing campaign
- **When** they create a party with `{ name, campaignId: "<campaign-id>" }`
- **Then** the party is persisted with the `campaignId`; the response includes the `campaignId`

#### Scenario: Creating a party without a campaignId

- **Given** an authenticated user
- **When** they create a party without a `campaignId`
- **Then** the party is created successfully; `campaignId` is absent or `undefined` on the returned object

#### Scenario: Updating a party to associate it with a campaign

- **Given** an authenticated user with an existing party and campaign
- **When** they PATCH the party to set `campaignId`
- **Then** the party is updated with the new `campaignId`

#### Scenario: Deleting a campaign does not delete associated parties

- **Given** a party with `campaignId` pointing to an existing campaign
- **When** the campaign is deleted
- **Then** the party still exists; its `campaignId` now references a deleted campaign (dangling reference)

### Requirement: ADDED Parties UI shows campaign selector

The system SHALL display a campaign selector (dropdown or similar) in the party create and edit forms.

#### Scenario: Campaign selector shows all user campaigns

- **Given** an authenticated user with two campaigns and the parties create/edit form open
- **When** they view the campaign selector
- **Then** both campaigns are listed as options, plus a "None" / no-campaign option

#### Scenario: Party with deleted campaign displays gracefully

- **Given** a party whose `campaignId` references a deleted campaign
- **When** the party is displayed in the UI
- **Then** the campaign field shows "No Campaign" (or equivalent) rather than an error

## MODIFIED Requirements

### Requirement: MODIFIED Party model includes optional campaignId

The `Party` interface SHALL include an optional `campaignId?: string` field.

#### Scenario: Existing parties without campaignId remain valid

- **Given** existing party documents in MongoDB that have no `campaignId` field
- **When** they are loaded via `storage.loadParties`
- **Then** they are returned without error; `campaignId` is `undefined`

## REMOVED Requirements

_None._

## Traceability

- Proposal element "Party → Campaign association in scope from day 1" → Requirement: Party can be associated with a campaign
- Design decision 5 (soft reference, optional campaignId) → all association scenarios
- Design decision 5 (dangling reference handled gracefully) → Scenario: Party with deleted campaign displays gracefully
- Requirement → Tasks: Party type update task, parties UI campaign selector task

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Dangling campaignId handled without error

- **Given** a party with a `campaignId` that no longer exists in the campaigns collection
- **When** the parties API or UI fetches the party
- **Then** no error is thrown; the party loads normally with `campaignId` treated as unresolved

### Requirement: Security

#### Scenario: Users cannot associate a party with another user's campaign

- **Given** user A owns campaign X; user B owns a party
- **When** user B tries to set `campaignId` to campaign X's ID
- **Then** the API either rejects the association (400/403) or silently stores it but never exposes campaign X's data to user B
