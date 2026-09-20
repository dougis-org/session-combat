## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Session log POST body size is bounded before parsing

The system SHALL reject `POST /api/campaigns/[id]/sessions` requests whose body exceeds `SESSION_BODY_MAX_BYTES` (64 KiB) with a 413 response, before attempting JSON parsing, using the same `readBoundedJson` mechanism as `POST /api/campaigns/[id]/rolls`.

#### Scenario: Oversized request body is rejected

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body larger than 64 KiB to `/api/campaigns/camp-1/sessions`
- **Then** the response is `413` and no session log is created

#### Scenario: Well-formed body within the limit is accepted for further validation

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a valid session-log body of typical size (well under 64 KiB) to `/api/campaigns/camp-1/sessions`
- **Then** the request proceeds to field validation (not rejected for size)

---

### Requirement: ADDED `datePlayed` must parse to a valid date

The system SHALL reject `POST /api/campaigns/[id]/sessions` requests where `datePlayed` is missing or does not parse to a valid `Date`, with a `400` response naming the `datePlayed` field.

#### Scenario: Missing datePlayed is rejected

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with no `datePlayed` field
- **Then** the response is `400` with an error message indicating `datePlayed` is required

#### Scenario: Unparseable datePlayed is rejected

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with `datePlayed: "not-a-date"`
- **Then** the response is `400` with an error message scoped to the `datePlayed` field; no session log is created

#### Scenario: Valid datePlayed (ISO string) is accepted

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with `datePlayed: "2026-09-19"`
- **Then** the request proceeds and the created session log's `datePlayed` is the corresponding `Date`

---

### Requirement: ADDED `title` and `summary` are length-bounded

The system SHALL reject `POST /api/campaigns/[id]/sessions` requests where `title` exceeds 200 characters or `summary` exceeds 10,000 characters, with a `400` response naming the offending field.

#### Scenario: Oversized title is rejected

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with a `title` of 201 characters
- **Then** the response is `400` with an error message scoped to the `title` field

#### Scenario: Oversized summary is rejected

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with a `summary` of 10,001 characters
- **Then** the response is `400` with an error message scoped to the `summary` field

#### Scenario: At-bound title and summary are accepted

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with a `title` of exactly 200 characters and a `summary` of exactly 10,000 characters
- **Then** the session log is created successfully with `201`

#### Scenario: Omitted title and summary are accepted

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with no `title` or `summary` fields
- **Then** the session log is created successfully with `201`, matching current behavior

---

### Requirement: ADDED `events` array elements are validated against the SessionEvent shape

The system SHALL reject `POST /api/campaigns/[id]/sessions` requests where any element of `events` does not match the `SessionEvent` shape (valid `type` enum value, non-empty `description` within bounds, and correctly-typed optional fields), with a `400` response identifying the offending element by index.

#### Scenario: Event with invalid type is rejected

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with `events: [{ type: "not_a_real_type", description: "x" }]`
- **Then** the response is `400` with an error message identifying `events[0].type`

#### Scenario: Event missing description is rejected

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with `events: [{ type: "custom" }]`
- **Then** the response is `400` with an error message identifying `events[0].description`

#### Scenario: Event with oversized description is rejected

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with an event whose `description` is 2,001 characters
- **Then** the response is `400` with an error message identifying the offending element

#### Scenario: Non-array events is rejected

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with `events: "not-an-array"`
- **Then** the response is `400`

#### Scenario: Full-shape combat_completed event is accepted

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with an `events` element matching the combat-event auto-capture shape (`type: 'combat_completed'`, `encounterId`, `encounterDescription`, `rounds`, `completedAt`, `campaignId` all present)
- **Then** the session log is created successfully with `201`, and the event is stored with all fields intact

#### Scenario: Minimal custom event from the manual form is accepted

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with an `events` element of `{ type: 'custom', description: 'Party found a secret door' }` (no optional fields)
- **Then** the session log is created successfully with `201`

#### Scenario: Omitted events defaults to an empty array

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with no `events` field
- **Then** the session log is created successfully with `201` and `events` is `[]`, matching current behavior

---

### Requirement: ADDED `events` array is bounded in size

The system SHALL reject `POST /api/campaigns/[id]/sessions` requests where `events` contains more than 200 elements, with a `400` response.

#### Scenario: Oversized events array is rejected

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with 201 valid `events` elements
- **Then** the response is `400`

#### Scenario: At-bound events array is accepted

- **Given** a DM authenticated against campaign `camp-1`
- **When** they POST a session-log body with exactly 200 valid `events` elements
- **Then** the session log is created successfully with `201`

## MODIFIED Requirements

### Requirement: MODIFIED Session log creation validates request structure before persisting

The system SHALL validate `datePlayed`, `title`, `summary`, and `events` against `sessionLogSubmissionSchema` before constructing or persisting a `SessionLog`, in place of the prior ad-hoc `typeof`/`Array.isArray` checks. The `sessionNumber` resolution (including the `getNextSessionNumber` fallback and its `SESSION_NUMBER_UNAVAILABLE` 503 response), and the `milestone`/`newLevel` handling, are unchanged by this requirement.

#### Scenario: Invalid sessionNumber still falls back to auto-numbering (unchanged)

- **Given** a DM authenticated against campaign `camp-1` with a valid otherwise-conforming session-log body
- **When** they POST with `sessionNumber: "not-a-number"` (or omitted)
- **Then** the system resolves the session number via `getNextSessionNumber` exactly as before this change, and the request is not rejected for `sessionNumber`'s type

#### Scenario: getNextSessionNumber failure still returns 503 (unchanged)

- **Given** a DM authenticated against campaign `camp-1` with a valid otherwise-conforming session-log body and no explicit `sessionNumber`
- **When** `storage.getNextSessionNumber` throws
- **Then** the response is `503` with `code: "SESSION_NUMBER_UNAVAILABLE"`, exactly as before this change

## Traceability

- Proposal element: "New `lib/validation/sessionLog.ts` module ... covering `datePlayed`, `title`, `summary`, `events`" -> Requirement: "ADDED `datePlayed` must parse to a valid date", "ADDED `title` and `summary` are length-bounded", "ADDED `events` array elements are validated against the SessionEvent shape", "ADDED `events` array is bounded in size"
- Proposal element: "Reuse `lib/server/readBoundedJson.ts` ... `SESSION_BODY_MAX_BYTES`" -> Requirement: "ADDED Session log POST body size is bounded before parsing"
- Proposal element: "leaving the `getNextSessionNumber` fallback branch and everything after it untouched" -> Requirement: "MODIFIED Session log creation validates request structure before persisting"
- Design decision: Decision 1 (schema scope) -> Requirement: "MODIFIED Session log creation validates request structure before persisting"
- Design decision: Decision 2 (field bounds) -> Requirement: "ADDED `title` and `summary` are length-bounded", "ADDED `events` array is bounded in size"
- Design decision: Decision 3 (event shape) -> Requirement: "ADDED `events` array elements are validated against the SessionEvent shape"
- Design decision: Decision 4 (`zodErrorResponse`) -> Requirement: all `ADDED` requirements above (shared error-response shape)
- Requirement -> Task(s): see `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Performance

Not affected by this change — validation adds a single in-memory zod parse per request, no additional I/O. No new latency budget is introduced beyond existing route performance.

### Requirement: Security

See functional scenarios: "Oversized request body is rejected", "Unparseable datePlayed is rejected", "Oversized title is rejected", "Oversized summary is rejected", "Event with invalid type is rejected", "Event missing description is rejected", "Event with oversized description is rejected", "Non-array events is rejected", "Oversized events array is rejected". These close the resource-exhaustion and data-integrity gaps identified in GitHub issue #562; no additional distinct security property (e.g. audit logging, token exposure) is introduced by this change.

### Requirement: Reliability

#### Scenario: Roll-submission route behavior is unchanged after zodErrorResponse extraction

- **Given** the existing `POST`/`GET /api/campaigns/[id]/rolls` test suite
- **When** `zodErrorResponse` is extracted and both routes are updated to call it
- **Then** all existing `rolls.route.test.ts` assertions continue to pass unmodified, confirming byte-identical error-response behavior
