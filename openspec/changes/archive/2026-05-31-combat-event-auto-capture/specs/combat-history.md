# Spec: Combat History

Covers: CombatState persistence model — insert vs upsert, `completedAt`, active-combat query.

## ADDED Requirements

### Requirement: ADDED Combat documents are inserted, not upserted

The system SHALL create a new `combatStates` document for every `POST /api/combat` request, never overwriting an existing document for the same user.

#### Scenario: Two sequential combats produce two documents

- **Given** a DM has completed one combat for a campaign
- **When** the DM starts a second combat (POST /api/combat)
- **Then** the `combatStates` collection contains two documents for that userId; the first document is unchanged

#### Scenario: POST without campaignId is rejected

- **Given** an authenticated DM
- **When** POST /api/combat is called without a `campaignId` field in the body
- **Then** the server responds with HTTP 400 and an error message; no document is inserted

---

### Requirement: ADDED `completedAt` is set when a combat ends

The system SHALL set `completedAt = new Date()` on a `combatStates` document when `PUT /api/combat/[id]` is called with `isActive: false`.

#### Scenario: Ending combat sets completedAt

- **Given** an active combat document in the DB (`isActive: true`, no `completedAt`)
- **When** PUT /api/combat/[id] is called with `{ isActive: false }`
- **Then** the document has `isActive: false` and `completedAt` is set to approximately the current time (within 5 seconds)

#### Scenario: Updating a non-isActive field does not set completedAt

- **Given** an active combat document
- **When** PUT /api/combat/[id] is called with `{ currentRound: 3 }` (isActive unchanged)
- **Then** `completedAt` remains unset; `isActive` remains `true`

---

### Requirement: ADDED endCombat awaits server confirmation before clearing local state

The system SHALL NOT clear client combat state until the PUT /api/combat/[id] call to set `isActive: false` has succeeded.

#### Scenario: endCombat clears state after successful PUT

- **Given** an active combat in `useCombat`
- **When** `endCombat()` is called and the PUT succeeds
- **Then** `combatState` becomes `null`; setup view is shown

#### Scenario: endCombat preserves local state on PUT failure

- **Given** an active combat in `useCombat`
- **When** `endCombat()` is called and the PUT returns an error
- **Then** `combatState` remains non-null; an error message is shown; the DM can retry

## MODIFIED Requirements

### Requirement: MODIFIED Active combat query filters by isActive

The system SHALL query `combatStates` with `{ userId, isActive: true }` when fetching the current combat (was: `{ userId }` only).

#### Scenario: GET /api/combat returns null when no active combat exists

- **Given** a DM who has completed one combat (isActive: false) and has not started another
- **When** GET /api/combat is called
- **Then** the response is `null` (HTTP 200 with null body)

#### Scenario: GET /api/combat returns the active combat when one exists

- **Given** a DM with one completed combat and one active combat in the DB
- **When** GET /api/combat is called
- **Then** the response contains the active combat document

#### Scenario: GET /api/combat/[id] still returns any document by id

- **Given** a completed combat document
- **When** GET /api/combat/[id] is called with its id
- **Then** the document is returned regardless of `isActive` value

## REMOVED Requirements

### Requirement: REMOVED Upsert-by-userId behavior on POST

**Reason:** Insert-on-create is required to maintain combat history. The upsert pattern prevented multiple combats from being stored per user.

## Traceability

- Proposal: "Change POST /api/combat from upsert-by-userId to insert" → Requirement: ADDED Combat documents are inserted
- Proposal: "PUT /api/combat/[id] — when isActive transitions to false, set completedAt" → Requirement: ADDED completedAt is set
- Proposal: "endCombat() to call PUT before clearing local state" → Requirement: ADDED endCombat awaits server confirmation
- Design Decision 1 → Requirements: ADDED insert behavior, MODIFIED active query
- Design Decision 2 → Requirement: ADDED endCombat server confirmation
- Requirements → Tasks: T1 (types), T2 (POST route), T3 (PUT route), T4 (GET route), T5 (useCombat endCombat)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: DB desync prevention on endCombat failure

- **Given** the PUT to set isActive=false returns a 500 error
- **When** endCombat() handles the error
- **Then** the client still shows the active combat UI; no silent data loss occurs; the user sees an error message

### Requirement: Security

#### Scenario: User cannot end another user's combat

- **Given** User A has an active combat with id `abc`
- **When** User B calls PUT /api/combat/abc with `{ isActive: false }`
- **Then** the server responds with HTTP 404 (document not found for that userId)
