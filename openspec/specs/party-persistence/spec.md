## ADDED Requirements

### Requirement: Party saves use the application UUID as the canonical identifier

The system SHALL persist and update party documents by matching on the
application-level party `id` together with `userId`. MongoDB `_id` SHALL be
treated as an internal storage detail and SHALL NOT be required for
`saveParty()` to update an existing party.

#### Scenario: Creating a new party stores the generated UUID

- **WHEN** an authenticated user creates a party through the party API
- **THEN** the system persists the party with the generated application UUID in
  the `id` field
- **AND** the saved document is associated with the authenticated user's
  `userId`

#### Scenario: Editing an existing party updates by id and userId

- **WHEN** an authenticated user edits an existing party that was previously
  loaded by the API
- **THEN** `saveParty()` matches the stored party by `{ id, userId }`
- **AND** the existing document is updated instead of creating a duplicate party

#### Scenario: Party saves do not depend on MongoDB _id in the API payload

- **WHEN** the party API saves a party object that does not include `_id`
- **THEN** the save operation still succeeds using the app-level `id`
- **AND** no MongoDB `_id` lookup is required to persist the update
