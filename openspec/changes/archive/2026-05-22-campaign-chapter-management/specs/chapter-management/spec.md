## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Collapsible Chapter List Editor

The system SHALL provide a collapsible "Chapter List" section in `CampaignEditor.tsx` allowing DMs to dynamically manage chapter lists (add, remove, edit titles, and reorder).

#### Scenario: DM adds a new chapter to a campaign
- **Given** the campaign editor is open
- **When** the DM expands the "Chapter List" section and clicks "+ Add Chapter"
- **Then** a new chapter row appears with an empty title input, a generated unique ID, and its order set to the end of the list.

#### Scenario: DM removes a chapter from a campaign
- **Given** the campaign editor has a chapter list with 3 chapters
- **When** the DM clicks "Remove" on the second chapter
- **Then** that chapter row is deleted, the third chapter is shifted up to order index 1, and the total chapter count becomes 2.

#### Scenario: DM reorders chapters using Move Up/Down buttons
- **Given** the campaign editor has chapters "A" (order 0) and "B" (order 1)
- **When** the DM clicks the "▲" (Move Up) button on chapter "B"
- **Then** chapter "B" is swapped to order 0, chapter "A" becomes order 1, and the DOM sequence updates to reflect this change.

---

### Requirement: ADDED Current Chapter Selector

The system SHALL render a "Current Chapter" select element in the campaign editor when chapters are present, mapping `currentChapterId` to chapter titles.

#### Scenario: DM selects a current active chapter
- **Given** a campaign has chapters "Ch. 1: Arrival" and "Ch. 2: Inn"
- **When** the DM selects "Ch. 2: Inn" in the "Current Chapter" dropdown and saves the campaign
- **Then** the campaign object is saved with `currentChapterId` set to the ID of "Ch. 2: Inn".

#### Scenario: Active chapter fallback when no chapters are defined
- **Given** a campaign has no chapters
- **When** the campaign editor is opened
- **Then** the "Current Chapter" picker displays an informative message stating "No chapters defined" and does not render a select dropdown.

#### Scenario: Safe cleanup when active chapter is deleted
- **Given** a campaign has "Ch. 1: Arrival" selected as the active chapter
- **When** the DM clicks "Remove" on "Ch. 1: Arrival" and saves the campaign
- **Then** `currentChapterId` is automatically cleared and saved as `undefined`.

---

### Requirement: ADDED Active Chapter Dashboard Display

The campaigns landing page SHALL resolve and display the title of the active chapter for each campaign card.

#### Scenario: Campaign card shows current active chapter title
- **Given** the campaigns landing page loads a campaign with `currentChapterId` pointing to a chapter titled "The Dungeon"
- **When** the card is rendered
- **Then** the card displays "📖 Current Chapter: Ch. 3: The Dungeon".

#### Scenario: Campaign card without active chapter shows standard count only
- **Given** the campaigns landing page loads a campaign with no chapters or no active chapter selected
- **When** the card is rendered
- **Then** it does not display any active chapter text, displaying only the total chapter count.

---

### Requirement: ADDED API Chapters and Active Chapter Integration

The campaigns REST API endpoints SHALL extract, sanitize, and validate the `chapters` and `currentChapterId` payload fields on creation and updates.

#### Scenario: POST campaign successfully persists chapters and current chapter ID
- **Given** an authenticated API request to POST `/api/campaigns` with a valid JSON payload containing a chapters array and `currentChapterId`
- **When** the server processes the request
- **Then** the campaign is created in the database and returned with the exact validated chapters and `currentChapterId`.

#### Scenario: PATCH campaign successfully updates chapters and current chapter ID
- **Given** a campaign exists in the database
- **When** an authenticated API request is sent to PATCH `/api/campaigns/[id]` containing new chapters and an updated `currentChapterId`
- **Then** the updated campaign is returned and persisted with the new details.

---

## Traceability

- Proposal element "Collapsible Chapter List Editor" -> Requirement: ADDED Collapsible Chapter List Editor
- Proposal element "Current Chapter Selector" -> Requirement: ADDED Current Chapter Selector
- Proposal element "Active Chapter display on landing page" -> Requirement: ADDED Active Chapter Dashboard Display
- Proposal element "API validation and persistence" -> Requirement: ADDED API Chapters and Active Chapter Integration
- Design decision 1 -> Requirement: ADDED Collapsible Chapter List Editor, ADDED Current Chapter Selector
- Design decision 2 -> Requirement: ADDED API Chapters and Active Chapter Integration
- Design decision 3 -> Requirement: ADDED Active Chapter Dashboard Display
- Requirement ADDED Collapsible Chapter List Editor -> Task: Implement chapters editor in CampaignEditor.tsx
- Requirement ADDED Current Chapter Selector -> Task: Implement active chapter select in CampaignEditor.tsx
- Requirement ADDED Active Chapter Dashboard Display -> Task: Update campaign card in app/campaigns/page.tsx
- Requirement ADDED API Chapters and Active Chapter Integration -> Task: Update campaigns POST and PATCH API routes

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Legacy campaign recovery
- **Given** a legacy campaign document exists in MongoDB with missing `chapters` or `currentChapterId` fields
- **When** the Campaigns Page load request is processed
- **Then** it is normalized and rendered safely without crashes, displaying zero chapters.
