## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED NPC join/departure events auto-populated in session create form

The system SHALL pre-populate `npc_joined` and `npc_left` events in the session journal create form by querying party membership changes since the previous session.

#### Scenario: NPC joined since last session

- **Given** a campaign with a linked party containing a member with `addedAt = T2`
- **And** the previous session has `datePlayed = T1` where `T1 < T2`
- **When** the DM opens the "New Session" form
- **Then** a pre-populated event appears: `{ type: "npc_joined", characterName: "<name>", description: "<name> joined the party", timestamp: T2 }`

#### Scenario: NPC departed since last session

- **Given** a campaign with a linked party containing a member with `leftAt = T2`
- **And** the previous session has `datePlayed = T1` where `T1 < T2`
- **When** the DM opens the "New Session" form
- **Then** a pre-populated event appears: `{ type: "npc_left", characterName: "<name>", description: "<name> departed the party", timestamp: T2 }`

#### Scenario: No party linked to campaign

- **Given** a campaign with no associated party (`campaignId` not set on any party)
- **When** the DM opens the "New Session" form
- **Then** no NPC events are pre-populated
- **And** a notice is shown: "No linked party found for this campaign."

#### Scenario: First session — no previous session date

- **Given** a campaign with no existing session logs
- **And** a linked party with members who have various `addedAt` times
- **When** the DM opens the "New Session" form
- **Then** all current active party members (those with no `leftAt`) appear as `npc_joined` events

#### Scenario: NPC member unchanged since last session

- **Given** a party member whose `addedAt` predates the last session and has no `leftAt`
- **When** the DM opens the "New Session" form
- **Then** that member does NOT appear in the pre-populated events

#### Scenario: DM removes a pre-populated event before saving

- **Given** the session create form has pre-populated NPC events
- **When** the DM removes one event from the list
- **Then** the saved session log does NOT include the removed event
- **And** the remaining events are saved correctly

#### Scenario: DM adds a custom event

- **Given** the session create form
- **When** the DM adds a custom event with `type: "custom"` and a description
- **Then** the saved session log includes the custom event alongside any auto-populated events

## MODIFIED Requirements

No existing requirements modified by this capability.

## REMOVED Requirements

No requirements removed by this capability.

## Traceability

- Proposal element (NPC auto-capture) → Requirements: ADDED NPC join/departure auto-populate
- Design decision 6 (time-window query against party.members) → all scenarios above
- Requirements → Tasks: npc-auto-capture task group in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Auto-populate handles party with both active and departed members

- **Given** a party with 3 members: one active since before last session, one joined since last session, one departed since last session
- **When** the session create form is opened
- **Then** exactly 2 events are pre-populated (the joined and the departed)
- **And** the unchanged active member does not appear
