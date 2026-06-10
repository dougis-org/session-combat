## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `Campaign.activeSessionId` field

The system SHALL include `activeSessionId?: string | null` on the `Campaign` type and persist it atomically in MongoDB.

#### Scenario: Field present after session opened

- **Given** a Campaign exists with no active session
- **When** a DM calls `POST /api/campaigns/:id/sessions/active`
- **Then** `GET /api/campaigns/:id` returns the Campaign with `activeSessionId` equal to the newly created `SessionLog.id`

#### Scenario: Field is null after session closed

- **Given** a Campaign has an active session (`activeSessionId` is set)
- **When** a DM calls `DELETE /api/campaigns/:id/sessions/active`
- **Then** `GET /api/campaigns/:id` returns the Campaign with `activeSessionId: null`

---

### Requirement: ADDED `POST /api/campaigns/:id/sessions/active` — open session

The system SHALL create a new `SessionLog` and set `campaign.activeSessionId` when a DM opens a session.

#### Scenario: DM opens session successfully

- **Given** an authenticated DM member of the campaign with no active session
- **When** `POST /api/campaigns/:id/sessions/active` is called
- **Then** the response status is 201
- **And** the response body is the new `SessionLog` with `datePlayed` approximately equal to `Date.now()` (within 5 seconds)
- **And** `GET /api/campaigns/:id` shows `activeSessionId` matching the returned `SessionLog.id`

#### Scenario: Conflict — session already active

- **Given** an authenticated DM with an active session already open
- **When** `POST /api/campaigns/:id/sessions/active` is called
- **Then** the response status is 409
- **And** the response body is `{ "error": "A session is already active" }`
- **And** the existing `activeSessionId` is unchanged

#### Scenario: Non-DM member is rejected

- **Given** an authenticated campaign member with role `player`
- **When** `POST /api/campaigns/:id/sessions/active` is called
- **Then** the response status is 404

#### Scenario: Unauthenticated request rejected

- **Given** no authentication credentials
- **When** `POST /api/campaigns/:id/sessions/active` is called
- **Then** the response status is 401

---

### Requirement: ADDED `DELETE /api/campaigns/:id/sessions/active` — close session

The system SHALL clear `campaign.activeSessionId` when a DM closes the active session, and SHALL return the closed session's ID.

#### Scenario: DM closes active session successfully

- **Given** an authenticated DM with an active session open
- **When** `DELETE /api/campaigns/:id/sessions/active` is called
- **Then** the response status is 200
- **And** the response body is `{ "sessionId": "<closed-session-id>" }`
- **And** `GET /api/campaigns/:id` returns `activeSessionId: null`

#### Scenario: No active session — 404

- **Given** an authenticated DM with no active session (`activeSessionId` is null or absent)
- **When** `DELETE /api/campaigns/:id/sessions/active` is called (without `?force=true`)
- **Then** the response status is 404

#### Scenario: Non-DM member is rejected

- **Given** an authenticated campaign member with role `player`
- **When** `DELETE /api/campaigns/:id/sessions/active` is called
- **Then** the response status is 404

#### Scenario: Unauthenticated request rejected

- **Given** no authentication credentials
- **When** `DELETE /api/campaigns/:id/sessions/active` is called
- **Then** the response status is 401

---

### Requirement: ADDED `DELETE ?force=true` — force-reset stale active session

The system SHALL unconditionally clear `activeSessionId` when `?force=true` is passed to `DELETE`, bypassing the "no active session" 404 guard.

#### Scenario: Force-reset clears stale `activeSessionId`

- **Given** an authenticated DM whose campaign has a stale `activeSessionId` (e.g., previous session never closed)
- **When** `DELETE /api/campaigns/:id/sessions/active?force=true` is called
- **Then** the response status is 200
- **And** `GET /api/campaigns/:id` returns `activeSessionId: null`

#### Scenario: Force-reset when no active session is a no-op success

- **Given** an authenticated DM with no active session
- **When** `DELETE /api/campaigns/:id/sessions/active?force=true` is called
- **Then** the response status is 200
- **And** `GET /api/campaigns/:id` returns `activeSessionId: null`

#### Scenario: After force-reset, DM can open a new session

- **Given** a stale `activeSessionId` was just force-reset via `DELETE ?force=true`
- **When** `POST /api/campaigns/:id/sessions/active` is called
- **Then** the response status is 201 (not 409)

---

### Requirement: ADDED `SessionLog` persisted independently of active session pointer

The system SHALL NOT delete the `SessionLog` document when `activeSessionId` is cleared.

#### Scenario: Session log remains after close

- **Given** a DM has opened and then closed an active session
- **When** `GET /api/campaigns/:id/sessions` is called
- **Then** the closed `SessionLog` is present in the response

---

## MODIFIED Requirements

### Requirement: MODIFIED `normalizeCampaign` passes through `activeSessionId`

The system SHALL continue to normalize campaign documents correctly when `activeSessionId` is absent or null.

#### Scenario: Normalization pass-through for absent field

- **Given** a legacy campaign document with no `activeSessionId` field
- **When** `normalizeCampaign` processes it
- **Then** the result does not include `activeSessionId` (field remains absent)

#### Scenario: Normalization pass-through for null value

- **Given** a campaign document where `activeSessionId` is `null`
- **When** `normalizeCampaign` processes it
- **Then** the result preserves `activeSessionId: null`

---

## REMOVED Requirements

None.

---

## Traceability

- Proposal: `activeSessionId` field → Requirement: ADDED `Campaign.activeSessionId` field
- Proposal: POST open → Requirement: ADDED `POST .../active`
- Proposal: DELETE close → Requirement: ADDED `DELETE .../active`
- Proposal: Force-reset escape hatch → Requirement: ADDED `DELETE ?force=true`
- Proposal: SessionLog not deleted on close → Requirement: ADDED SessionLog persists independently
- Proposal: normalizeCampaign pass-through → Requirement: MODIFIED normalizeCampaign
- Design Decision 1 (null over $unset) → Scenarios: "Field is null after session closed", "Force-reset" scenarios
- Design Decision 2 (atomic updateOne) → Testability notes in design.md
- Design Decision 3 (force-reset) → Requirement: ADDED `DELETE ?force=true`
- Design Decision 4 (datePlayed = now) → Scenario: "DM opens session successfully" (datePlayed ≈ Date.now())
- Design Decision 5 (409 guard) → Scenario: "Conflict — session already active"
- Requirements → Tasks: all in tasks.md

---

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios:
- "Non-DM member is rejected" (POST and DELETE)
- "Unauthenticated request rejected" (POST and DELETE)

No additional security properties. `activeSessionId` is not a secret token; it is a foreign key to a `SessionLog.id` that the DM created. Error bodies do not expose internal DB state.

### Requirement: Reliability

#### Scenario: Concurrent write safety

- **Given** `setActiveCampaignSession` is called concurrently with another field update on the same campaign document
- **When** the atomic `updateOne $set` completes
- **Then** only `activeSessionId` and `updatedAt` are modified; all other campaign fields retain their values
