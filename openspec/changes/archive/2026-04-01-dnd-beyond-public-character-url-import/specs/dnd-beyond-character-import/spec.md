## MODIFIED Requirements

### Requirement: Users can import a public D&D Beyond character by URL
The system SHALL allow an authenticated user to submit a publicly available D&D Beyond character URL and import that character into the user's character list when the system can access and parse the character data from that URL.

#### Scenario: Successful import creates a new character
- **WHEN** an authenticated user submits a publicly available D&D Beyond character URL that the system can fetch and parse and no existing character with the same name exists for that user
- **THEN** the system fetches and parses the remote character data from the submitted URL
- **THEN** the system normalizes the imported data into a valid local `Character` record
- **THEN** the system persists the new character for that user

#### Scenario: Any publicly accessible character URL is accepted
- **WHEN** an authenticated user submits a publicly accessible URL that the system can fetch and parse into importable D&D Beyond character data
- **THEN** the system treats the URL as a supported import source without requiring a specific path shape

#### Scenario: Import requires authentication
- **WHEN** an unauthenticated request is made to the import workflow
- **THEN** the system rejects the request using the application's existing auth enforcement behavior

### Requirement: Import failures are explicit and non-destructive
The system SHALL return explicit failure results when a submitted URL cannot be accessed or cannot be parsed into importable D&D Beyond character data, as well as for remote fetch failures, parsing failures, and validation failures, without modifying existing character records.

#### Scenario: Unsupported or invalid URL is rejected
- **WHEN** the user submits a URL that the system cannot access or cannot parse into importable D&D Beyond character data
- **THEN** the system rejects the request with a validation or import error
- **THEN** no character data is created or modified

#### Scenario: Source character cannot be accessed or parsed
- **WHEN** the remote character page is unavailable, not public, times out, or cannot be parsed into importable data
- **THEN** the system returns an import failure with a user-actionable error
- **THEN** no character data is created or modified

#### Scenario: Access drives acceptance before URL shape assumptions
- **WHEN** the system can access the submitted URL and parse importable character data from it
- **THEN** shape-only assumptions do not block the import
- **THEN** the system proceeds with normalization and persistence

### Requirement: The import UI preserves the submitted source URL verbatim
The system SHALL display the exact URL entered by the user as transient import source data and SHALL prompt the user to enter a publicly available URL.

#### Scenario: Submitted public URL is echoed verbatim
- **WHEN** the user enters a URL into the import flow and the UI displays source URL state or follow-up messaging
- **THEN** the displayed URL matches the submitted text
- **THEN** the display does not canonicalize or rewrite the URL

#### Scenario: UI copy mentions publicly available URL
- **WHEN** the user opens the D&D Beyond import form
- **THEN** the form instructs the user to provide a publicly available URL
