## ADDED Requirements

### Requirement: Campaign Encounters Migration Script
The system SHALL provide a script to retroactively populate base encounters for existing campaigns that were copied from templates.

#### Scenario: Campaign has missing base encounters
- **WHEN** the script runs and finds a campaign with a `templateId` where the template has encounters not present (by exact name) in the campaign
- **THEN** it generates new `Encounter` records for the missing ones, assigns them to the campaign owner, adds their IDs to the campaign's `encounterIds`, and saves both.

#### Scenario: Campaign already has a base encounter (Name Match)
- **WHEN** the script runs and finds a campaign with an encounter whose name exactly matches a base encounter from its template
- **THEN** it skips that specific base encounter, preventing duplication.

#### Scenario: Campaign has no templateId
- **WHEN** the script runs and encounters a custom campaign with no `templateId`
- **THEN** it ignores the campaign.

#### Scenario: Template has no base encounters
- **WHEN** the script runs and the linked template has an empty or undefined `encounters` array
- **THEN** it ignores the campaign.

#### Scenario: Migration encounters an error mid-campaign
- **WHEN** the script fails to save one of the new encounters for a campaign
- **THEN** it catches the error, logs it, stops processing that specific campaign (avoiding partial saves if possible), and continues to the next campaign.
