## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED PartyMember type with join and departure timestamps

The system SHALL track when each character joined and left a party via `addedAt` and `leftAt` timestamps on each `PartyMember` entry.

#### Scenario: New member added to party

- **Given** an existing party with `members: []`
- **When** a PUT request is sent with `characterIds: ["char-1"]`
- **Then** the party is saved with `members: [{ characterId: "char-1", addedAt: <now>, leftAt: undefined }]`

#### Scenario: Member removed from party

- **Given** a party with `members: [{ characterId: "char-1", addedAt: <past> }]`
- **When** a PUT request is sent with `characterIds: []`
- **Then** the member record is updated to `{ characterId: "char-1", addedAt: <past>, leftAt: <now> }`
- **And** the member is NOT deleted from the array

#### Scenario: Member present in both old and new list

- **Given** a party with `members: [{ characterId: "char-1", addedAt: <past> }]`
- **When** a PUT request is sent with `characterIds: ["char-1"]`
- **Then** the member record is unchanged (no `addedAt` or `leftAt` modification)

#### Scenario: Active members derived correctly

- **Given** a party with `members: [{ characterId: "char-1", addedAt: T1 }, { characterId: "char-2", addedAt: T2, leftAt: T3 }]`
- **When** `expandPartyToCharacters` is called
- **Then** only `char-1` is returned (char-2 has `leftAt` set)

### Requirement: ADDED Migration default for existing party documents

The system SHALL derive `members` from legacy `characterIds` on first read if `members` is absent.

#### Scenario: Legacy party document loaded

- **Given** a MongoDB party document with `characterIds: ["char-1", "char-2"]` and no `members` field
- **When** `storage.loadParties()` reads the document
- **Then** the returned party has `members: [{ characterId: "char-1", addedAt: party.createdAt }, { characterId: "char-2", addedAt: party.createdAt }]`
- **And** both members have no `leftAt`

#### Scenario: Already-migrated party not re-migrated

- **Given** a party document with a populated `members` array
- **When** `storage.loadParties()` reads the document
- **Then** the `members` array is returned as-is without modification

## MODIFIED Requirements

### Requirement: MODIFIED Character soft-delete cascades to party memberships

The system SHALL set `leftAt = now` on all active `PartyMember` entries across all parties when a character is soft-deleted, instead of removing the entry from `characterIds`.

#### Scenario: Character deleted sets leftAt on all party memberships

- **Given** two parties each containing `char-1` as an active member
- **When** `storage.deleteCharacter("char-1", userId)` is called
- **Then** both parties have `members[char-1].leftAt = <now>`
- **And** no `PartyMember` entry is deleted
- **And** the character's `deletedAt` timestamp is set

#### Scenario: Deleting a character not in any party

- **Given** a character that is not a member of any party
- **When** `storage.deleteCharacter(id, userId)` is called
- **Then** the character is soft-deleted
- **And** no party documents are modified

### Requirement: MODIFIED Party create initialises members from characterIds input

The system SHALL accept `characterIds` on POST `/api/parties` and convert them to `members[]` with `addedAt = now`.

#### Scenario: Party created with initial members

- **Given** a POST request to `/api/parties` with `{ name: "X", characterIds: ["char-1"] }`
- **When** the request is processed
- **Then** the created party has `members: [{ characterId: "char-1", addedAt: <now> }]`
- **And** no `characterIds` field exists on the stored document

## REMOVED Requirements

### Requirement: REMOVED Party.characterIds field

Reason for removal: Replaced by `Party.members: PartyMember[]`. The flat array had no temporal information and made it impossible to determine when characters joined or left. All callers updated to derive active member IDs from `members.filter(m => !m.leftAt).map(m => m.characterId)`.

## Traceability

- Proposal element (Party refactor) → Requirements: ADDED PartyMember type, ADDED Migration, MODIFIED cascade, MODIFIED create
- Design decision 2 (replace characterIds) → ADDED PartyMember type, REMOVED characterIds
- Design decision 3 (PUT diff-and-timestamp) → MODIFIED Party create, ADDED Member removed scenario
- Design decision 4 (cascade leftAt) → MODIFIED cascade
- Design decision 7 (lazy migration) → ADDED Migration default
- Requirements → Tasks: party-refactor task group in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No party data loss during migration

- **Given** an existing production party with `characterIds` and no `members`
- **When** the application is deployed and the party is read for the first time
- **Then** all characters from `characterIds` appear as active members with `addedAt = party.createdAt`
- **And** no characters are lost

### Requirement: Security

#### Scenario: Party members only accessible to owner

- **Given** user A has a party with members
- **When** user B sends `GET /api/parties/[A's party id]`
- **Then** the response is 404 (not found for user B)
- **And** user B cannot read user A's party membership history
