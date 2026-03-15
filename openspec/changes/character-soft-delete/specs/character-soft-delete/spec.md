## ADDED Requirements

### Requirement: Character model includes soft delete timestamp

The Character data model SHALL include a `deletedAt` field that stores the UTC timestamp when a character is deleted. This field SHALL be optional (null/undefined) for active characters.

#### Scenario: Active character has no deletion timestamp
- **WHEN** a character is created or retrieved
- **THEN** the `deletedAt` field is null or undefined

#### Scenario: Deleted character has deletion timestamp
- **WHEN** a character is deleted
- **THEN** the `deletedAt` field contains an ISO 8601 formatted UTC timestamp

### Requirement: Delete operation soft deletes character

The DELETE endpoint for a character (DELETE /api/characters/{id}) SHALL mark the character as deleted by setting the `deletedAt` timestamp instead of removing the document from the database.

#### Scenario: Character is soft deleted on delete request
- **WHEN** a user calls DELETE /api/characters/{id} with valid ID and ownership
- **THEN** the response indicates successful deletion
- **THEN** the character document remains in the database
- **THEN** the character's `deletedAt` field is set to current UTC time

#### Scenario: Delete response confirms successful deletion
- **WHEN** DELETE /api/characters/{id} succeeds
- **THEN** the response returns status 200 with success message

### Requirement: Character lists exclude soft-deleted characters

All character list queries SHALL automatically exclude characters that have been soft-deleted (have a non-null `deletedAt` timestamp).

#### Scenario: Character list excludes deleted characters
- **WHEN** a user requests their character list (GET /api/characters)
- **THEN** the response includes only characters with `deletedAt = null`
- **THEN** deleted characters do not appear in the list

#### Scenario: Newly deleted character disappears from list
- **WHEN** a user deletes a character
- **THEN** subsequent requests to GET /api/characters exclude the deleted character

#### Scenario: Active and deleted characters coexist correctly
- **WHEN** a user has both active and deleted characters
- **THEN** character lists show only active characters
- **THEN** subsequent deletes of active characters work correctly

### Requirement: Character detail endpoint returns 404 for deleted characters

The GET endpoint for a specific character (GET /api/characters/{id}) SHALL return a 404 Not Found error when attempting to retrieve a soft-deleted character.

#### Scenario: Accessing deleted character returns 404
- **WHEN** a user calls GET /api/characters/{id} for a deleted character
- **THEN** the response returns status 404
- **THEN** the response contains error message "Character not found"

#### Scenario: Accessing active character succeeds normally
- **WHEN** a user calls GET /api/characters/{id} for an active character
- **THEN** the response returns status 200 with full character data

### Requirement: Soft delete maintains data integrity with parties

When a character is soft deleted, the system SHALL remove references to that character from any parties that include it. This operation SHALL occur atomically with the soft delete.

#### Scenario: Character is removed from parties on soft delete
- **WHEN** a user deletes a character that is referenced in parties
- **THEN** the character ID is removed from all party `characterIds` arrays
- **THEN** the character no longer appears in any party's combatant list

#### Scenario: Deletion succeeds even if character not in any party
- **WHEN** a user deletes a character that belongs to no parties
- **THEN** the delete operation succeeds
- **THEN** the character is marked as deleted

### Requirement: Backward compatibility with existing characters

The system SHALL handle existing characters in the database that do not have a `deletedAt` field, treating them as active characters.

#### Scenario: Characters without deletedAt field are treated as active
- **WHEN** the system loads characters that were created before soft delete implementation
- **THEN** characters without a `deletedAt` field appear in character lists
- **THEN** they are treated as active (non-deleted) characters

#### Scenario: Query filters handle both null and missing deletedAt field
- **WHEN** the system executes a character list query
- **THEN** the filter correctly excludes characters with `deletedAt != null`
- **THEN** the filter includes characters with `deletedAt = null` or where field is missing

## Non-Functional Requirements

### Performance

The system SHALL maintain query performance when filtering deleted characters.

#### Scenario: Character list query with many deleted characters
- **WHEN** a user has 100+ characters with 50+ deleted
- **THEN** listing characters completes in < 100ms
- **THEN** filtering deleted characters does not cause noticeable performance degradation

### Data Integrity

The system SHALL preserve all character data for audit and potential recovery purposes.

#### Scenario: Deleted character data remains in database
- **WHEN** a character is soft deleted
- **THEN** all character data (name, stats, abilities, etc.) remains unchanged
- **THEN** only the `deletedAt` timestamp is modified

### Consistency

The system SHALL ensure consistent filtering of deleted characters across all queries and endpoints.

#### Scenario: Deleted characters cannot be accessed through any endpoint
- **WHEN** a character is deleted
- **THEN** the character is excluded from all GET list queries
- **THEN** GET detail endpoint returns 404 for the character
- **THEN** the character does not appear in party combats

