## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED deleteCharacter throws when no document is matched

The system SHALL throw an `Error` when `deleteCharacter` is called with an `id`/`userId` pair that does not match any document in the `characters` collection, converting what was previously a silent no-op into a detectable failure.

#### Scenario: Delete succeeds for an existing character

- **Given** a character exists in the `characters` collection with the given `id` and `userId`
- **When** `deleteCharacter(id, userId)` is called
- **Then** the character's `deletedAt` field is set to a current `Date`, the function resolves without error, and the DELETE endpoint returns HTTP 200

#### Scenario: Delete throws when character is not found

- **Given** no document in the `characters` collection matches the given `id` and `userId`
- **When** `deleteCharacter(id, userId)` is called
- **Then** the function throws an `Error` with message `Character <id> not found` and the DELETE endpoint returns HTTP 500

#### Scenario: Delete is not re-entrant for an already-deleted character

- **Given** a character has already been soft-deleted (`deletedAt` is set)
- **When** the DELETE route handler is called again for the same character
- **Then** the route's `loadCharacters` pre-check returns nothing (character not in `characters_active` view), the handler returns HTTP 404 **before** calling `deleteCharacter`, and `deleteCharacter` is never invoked

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element: `deleteCharacter` silent failure on `matchedCount === 0` -> Requirement: MODIFIED deleteCharacter throws when no document is matched
- Design decision: Decision 2 (`matchedCount` guard) -> Requirement: MODIFIED deleteCharacter throws when no document is matched
- Requirement -> Task(s): Task 2 in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

See functional scenario: [Delete throws when character is not found]
