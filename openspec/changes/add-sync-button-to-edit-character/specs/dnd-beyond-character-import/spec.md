## ADDED Requirements

### Requirement: Users can trigger a sync from D&D Beyond from both the View and Edit screens
The system SHALL display the "Sync from D&D Beyond" action for characters linked to D&D Beyond on both the Character View screen and the Character Editor screen.

#### Scenario: Sync button is visible on Character View screen
- **WHEN** an authenticated user views a character that is linked to D&D Beyond
- **THEN** the system displays the "Sync from D&D Beyond" button
- **WHEN** the user clicks the button
- **THEN** the system opens the sync confirmation modal

#### Scenario: Sync button is visible on Character Editor screen
- **WHEN** an authenticated user edits a character that is linked to D&D Beyond
- **THEN** the system displays the "Sync from D&D Beyond" button
- **WHEN** the user clicks the button
- **THEN** the system opens the sync confirmation modal
