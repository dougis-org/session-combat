## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED "user can create a party" seeds and selects 4 real members

The system SHALL create a party with 4 explicitly named, seeded characters and assert member count is 4.

#### Scenario: Party created with 4 seeded members

- **Given** a fresh registered user with 4 characters seeded via API ("Aragorn", "Legolas", "Gimli", "Gandalf" with identity prefix)
- **When** `createParty` is called with all 4 names in `memberNames`
- **Then** the party card is visible, the page is not at `/parties/create`, and "Members: 4" is shown

---

### Requirement: MODIFIED "party with different member counts" seeds 6 characters and creates two parties

The system SHALL create a small party (2 members) and a large party (6 members) using explicitly named seeded characters.

#### Scenario: Small party with 2 of 6 seeded members

- **Given** a fresh registered user with 6 characters seeded
- **When** `createParty` is called for "Small Group" with the first 2 names
- **Then** "Members: 2" is shown on the Small Group party card

#### Scenario: Large party with all 6 seeded members

- **Given** the same user with 6 characters seeded
- **When** `createParty` is called for "Large Group" with all 6 names
- **Then** "Members: 6" is shown on the Large Group party card

---

### Requirement: MODIFIED "complete end-to-end flow" passes explicit member name to `createParty`

The system SHALL pass `memberNames: [identity.name("Thorin")]` (the one character created via UI) rather than the aspirational `memberCount: 13`.

#### Scenario: End-to-end flow creates party with the one available character

- **Given** a fresh registered user who has created "Thorin" via the character creation UI
- **When** `createParty` is called with `memberNames: [identity.name("Thorin")]`
- **Then** the party is created, the page navigates away from `/parties/create`, and the combat screen opens successfully

## REMOVED Requirements

### Requirement: REMOVED Aspirational `memberCount` values that exceed available characters

Reason for removal: `memberCount: 13` and similar values silently resolve to selecting 0 or 1 members. Replaced by explicit name arrays matching the characters actually present.

## Traceability

- Proposal element "Extended scope — seed real members in combat party tests" → all requirements in this spec
- Design decision 4 (combat party tests get real member seeding) → all requirements in this spec
- Requirements → Tasks: T3 (update `combat.spec.ts` party tests)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Each combat party test is isolated

- **Given** three combat party tests running in parallel workers
- **When** each registers its own user and seeds its own characters
- **Then** no character list from one test is visible in another test's `PartyEditor`
