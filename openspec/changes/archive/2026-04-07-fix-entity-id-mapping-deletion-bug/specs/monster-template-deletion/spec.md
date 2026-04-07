## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED User monster template deletion removes the record from the database

The system SHALL delete a user-owned monster template document from MongoDB when a valid delete request is received, such that the template does not reappear after the UI refreshes.

Previously the deletion silently failed because `loadMonsterTemplates` returned entities with `id` set to the MongoDB ObjectId string instead of the stored UUID. The corrected loader returns the UUID, making `deleteOne({ id, userId })` match correctly.

#### Scenario: Confirmed deletion removes user monster template

- **Given** an authenticated user has at least one custom monster template
- **When** a DELETE request is sent to /api/monsters/[id] with a valid auth token
- **Then** the API returns HTTP 200
- **And** a subsequent GET /api/monsters does not include the deleted template

#### Scenario: Unauthenticated delete request is rejected

- **Given** a DELETE request to /api/monsters/[id] is made without a valid auth token
- **When** the request is processed
- **Then** the API returns HTTP 401
- **And** no document is deleted

### Requirement: MODIFIED Global monster template loader returns correct id

The system SHALL return the UUID `id` field (not the ObjectId string) from `loadGlobalMonsterTemplates`, consistent with the fix applied to all other loaders.

Note: Full validation of admin global template deletion is tracked in #126 (the route passes `auth.userId` instead of `GLOBAL_USER_ID` to `deleteMonsterTemplate`, a separate bug). This requirement covers only the loader id-ordering fix.

#### Scenario: loadGlobalMonsterTemplates returns UUID ids

- **Given** global monster templates exist in the database with a UUID `id` field
- **When** `storage.loadGlobalMonsterTemplates()` is called
- **Then** each returned template has `id` equal to the UUID stored in the document
- **And** not the MongoDB ObjectId string

## REMOVED Requirements

None removed.

## Traceability

- Proposal element (fix `loadMonsterTemplates` id ordering) → Requirement: MODIFIED User monster template deletion
- Proposal element (fix `loadGlobalMonsterTemplates` id ordering) → Requirement: MODIFIED Global monster template loader
- Design decision 1 (fix at the loader) → both MODIFIED requirements
- Requirements → Tasks: `tasks.md` — Fix loadMonsterTemplates and loadGlobalMonsterTemplates in lib/storage.ts

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: User cannot delete another user's monster template

- **Given** User A and User B each have a custom monster template
- **When** User A sends a DELETE request for User B's template ID
- **Then** the API returns HTTP 404
- **And** User B's template is not deleted

### Requirement: Reliability

#### Scenario: Existing create/read/edit flows for monster templates are unaffected

- **Given** the loader fix returns UUID ids instead of ObjectId strings
- **When** the monster library UI fetches and displays templates
- **Then** all templates render correctly with no visible change to the user
- **And** editing a template continues to work
