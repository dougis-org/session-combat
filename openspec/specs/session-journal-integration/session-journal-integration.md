# Spec: Session Journal Integration

Covers: Pre-population of `combat_completed` events in the session log create form.

## ADDED Requirements

### Requirement: ADDED Session log create form pre-populates combat events

The system SHALL fetch completed combat events for the campaign and merge them into the session log `events[]` pre-population list when the DM opens the "New Session Log" form.

#### Scenario: Combat events appear in new session log form

- **Given** campaign `camp-1` has two completed combats since the last session's `datePlayed`
- **When** the DM opens the "New Session Log" form for camp-1
- **Then** two `combat_completed` events are pre-populated in the events list, each showing the encounter description and round count

#### Scenario: No combat events — form opens normally

- **Given** a campaign with no completed combats in the window
- **When** the DM opens the "New Session Log" form
- **Then** the form opens with an empty events list (or only NPC events if applicable); no error occurs

#### Scenario: Combat events merged with NPC events

- **Given** a campaign has one NPC event and one completed combat in the window
- **When** the DM opens the "New Session Log" form
- **Then** both events appear in the pre-population list; the DM can edit, reorder, or remove them before saving

#### Scenario: DM can remove a pre-populated combat event before saving

- **Given** a combat_completed event is pre-populated in the form
- **When** the DM removes it from the list
- **Then** the session log is saved without that event; the combat document in the DB is unchanged

---

### Requirement: ADDED `since` defaults to campaign createdAt when no prior sessions exist

The system SHALL use the campaign's `createdAt` date as the `since` parameter for the combat-events query when no prior session log exists for the campaign.

#### Scenario: First session log captures all campaign combats

- **Given** a campaign with no session logs and three completed combats
- **When** the DM opens the "New Session Log" form
- **Then** all three combat events are pre-populated (since = campaign createdAt)

#### Scenario: Subsequent session log captures only new combats

- **Given** a campaign with one session log dated at T1, and two combats — one before T1 and one after T1
- **When** the DM opens the "New Session Log" form
- **Then** only the post-T1 combat event is pre-populated

---

### Requirement: ADDED combat_completed event shape

The system SHALL produce `SessionEvent` objects with the following shape for completed combats:

```ts
{
  type: 'combat_completed',
  description: `Combat: ${encounterDescription || 'Unnamed encounter'} (${rounds} rounds)`,
  encounterId: string | undefined,
  encounterDescription: string | undefined,
  rounds: number,
  completedAt: Date,
  campaignId: string,
}
```

#### Scenario: Event description includes encounter name and round count

- **Given** a completed combat with `encounterDescription: 'Goblin Ambush'` and `currentRound: 4`
- **When** the event is constructed
- **Then** `description` is `"Combat: Goblin Ambush (3 rounds)"` (rounds = currentRound - 1)

#### Scenario: Event description degrades gracefully when no encounter description

- **Given** a completed combat with no `encounterDescription` and `currentRound: 3`
- **When** the event is constructed
- **Then** `description` is `"Combat: Unnamed encounter (2 rounds)"`

## MODIFIED Requirements

None — session log create form gains additive behavior only.

## REMOVED Requirements

None.

## Traceability

- Proposal: "When the DM creates a session log entry, combats that ran since the last session are pre-populated" → Requirement: ADDED Session log create form pre-populates combat events
- Proposal: "since fallback to campaign createdAt" → Requirement: ADDED since defaults to campaign createdAt
- Design Decision 4 → Requirements: ADDED event shape, ADDED form pre-population
- Design Decision 5 → Requirement: ADDED since defaults to campaign createdAt
- Requirements → Tasks: T7 (combat-events endpoint), T8 (session form integration)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Form loads even if combat-events fetch fails

- **Given** the GET /api/campaigns/[id]/combat-events endpoint returns a 500 error
- **When** the DM opens the "New Session Log" form
- **Then** the form still opens; combat events are empty (not pre-populated); the DM can still create the session log manually; no unhandled exception is thrown

### Requirement: Security

#### Scenario: Combat events are scoped to the authenticated user's campaign

- **Given** an authenticated DM viewing their campaign
- **When** the "New Session Log" form fetches combat events
- **Then** only combats belonging to that DM's campaign are returned (userId + campaignId filter enforced server-side)
