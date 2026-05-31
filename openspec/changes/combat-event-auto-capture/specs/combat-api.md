# Spec: Combat API & useCombat Hook

Covers: API contract for combat routes; `useCombat` hook changes; new campaign combat route.

## ADDED Requirements

### Requirement: ADDED useCombat accepts campaignId parameter

The system SHALL accept a `campaignId` string option in `useCombat({ campaignId })` and include it when creating a new combat via POST.

#### Scenario: campaignId is passed through to POST body

- **Given** `useCombat({ campaignId: 'campaign-123' })` is used on the campaign combat page
- **When** the DM starts a combat
- **Then** POST /api/combat is called with `{ campaignId: 'campaign-123', ... }` in the request body

---

### Requirement: ADDED useCombat uses PUT for state updates after creation

The system SHALL use PUT /api/combat/[id] for all combat state changes after the initial create, using the `id` from the POST 201 response.

#### Scenario: State update after creation uses PUT

- **Given** a combat was created via POST, returning `{ id: 'combat-abc', ... }`
- **When** the DM advances to the next turn (currentTurnIndex increments)
- **Then** PUT /api/combat/combat-abc is called with the updated state; POST /api/combat is NOT called again

#### Scenario: Page refresh resumes with correct id

- **Given** a DM has an active combat (id: 'combat-abc') and refreshes the page
- **When** `useCombat` loads and GET /api/combat returns the active document
- **Then** all subsequent state updates use PUT /api/combat/combat-abc

---

### Requirement: ADDED GET /api/campaigns/[id]/combat-events endpoint

The system SHALL provide `GET /api/campaigns/[id]/combat-events?since=<ISO date>` which returns a `SessionEvent[]` of `combat_completed` events for all combats in that campaign completed after `since`.

#### Scenario: Returns combat events in the window

- **Given** campaign `camp-1` has two completed combats: one at T1 and one at T2, where T1 < since < T2
- **When** GET /api/campaigns/camp-1/combat-events?since=T1_plus_1s is called
- **Then** the response contains exactly one event (for T2 combat); event shape includes `type: 'combat_completed'`, `description`, `rounds`, `completedAt`, `campaignId`

#### Scenario: Returns empty array when no completed combats in window

- **Given** a campaign with no completed combats after `since`
- **When** GET /api/campaigns/[id]/combat-events?since=<date> is called
- **Then** the response is `[]`

#### Scenario: Excludes active combats

- **Given** a campaign with one active combat (no completedAt) and one completed combat
- **When** GET /api/campaigns/[id]/combat-events is called
- **Then** only the completed combat appears in the result

#### Scenario: Excludes combats from other campaigns

- **Given** the DM has combats for campaign A and campaign B
- **When** GET /api/campaigns/A/combat-events is called
- **Then** only campaign A combats appear in the result

#### Scenario: Unauthenticated request is rejected

- **Given** no auth token
- **When** GET /api/campaigns/[id]/combat-events is called
- **Then** HTTP 401 is returned

---

### Requirement: ADDED /campaigns/[id]/combat route

The system SHALL provide a `/campaigns/[id]/combat` page that renders the combat UI with `campaignId` taken from the URL param.

#### Scenario: Campaign combat page renders correctly

- **Given** a DM navigates to /campaigns/camp-1/combat
- **When** the page loads
- **Then** the combat UI renders; `useCombat` is initialized with `campaignId: 'camp-1'`

---

### Requirement: ADDED MongoDB index on combatStates

The system SHALL have a compound index `{ userId: 1, campaignId: 1, completedAt: 1 }` on the `combatStates` collection.

#### Scenario: Index exists after deployment

- **Given** the application has started
- **When** `db.combatStates.getIndexes()` is inspected
- **Then** an index covering `{ userId, campaignId, completedAt }` is present

## MODIFIED Requirements

### Requirement: MODIFIED POST /api/combat creates a new document

The system SHALL insert a new `combatStates` document (previously upserted by userId).

#### Scenario: POST returns 201 with the new document including id

- **Given** an authenticated DM with `campaignId` in the request body
- **When** POST /api/combat is called
- **Then** HTTP 201 is returned with the new document; `id` matches a UUID; the document exists in the DB

## REMOVED Requirements

None beyond what is captured in combat-history.md.

## Traceability

- Design Decision 1 → Requirements: ADDED useCombat uses PUT for updates, MODIFIED POST creates new document
- Design Decision 3 → Requirement: ADDED useCombat accepts campaignId
- Design Decision 4 → Requirement: ADDED GET /api/campaigns/[id]/combat-events
- Design Decision 6 → Requirement: ADDED /campaigns/[id]/combat route
- Design Decision 7 → Requirement: ADDED MongoDB index
- Requirements → Tasks: T1 (types), T2 (POST route), T3 (PUT route), T4 (GET route), T5 (useCombat refactor), T6 (campaign route), T7 (combat-events endpoint)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Combat events only returned for authenticated user's campaigns

- **Given** User A is authenticated and owns campaign `camp-1`; User B owns `camp-2`
- **When** User A calls GET /api/campaigns/camp-2/combat-events
- **Then** HTTP 200 is returned with `[]` (no events; User A has no combats for camp-2)

### Requirement: Performance

#### Scenario: Combat event query uses index

- **Given** a campaign with 100 completed combats
- **When** GET /api/campaigns/[id]/combat-events?since=<date> is called
- **Then** the query uses the `{ userId, campaignId, completedAt }` index (verified by explain plan in integration tests)
