## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Campaign Catalog section on dashboard

The system SHALL render a "Campaign Catalog" section below the user's own campaigns on the campaign dashboard (`app/campaigns/page.tsx`) that displays all global campaign templates.

#### Scenario: Catalog section renders below user campaigns

- **Given** the campaign dashboard loads
- **When** the page renders
- **Then** the user's own campaigns appear first, followed by a clearly labelled "Campaign Catalog" section below them

#### Scenario: Catalog shows available templates

- **Given** three global campaign templates exist
- **When** the campaign dashboard loads
- **Then** each template is displayed showing its name, moduleName, and chapter count
- **And** each template has a "Copy" button

#### Scenario: Empty catalog renders gracefully

- **Given** no global campaign templates exist
- **When** the campaign dashboard loads
- **Then** the catalog section renders without error, showing a helpful empty-state message (e.g., "No campaign templates available yet.")

---

### Requirement: ADDED Copy button triggers template copy

The system SHALL render a Copy button on each catalog entry that, when clicked, calls `POST /api/campaigns/global/[id]/copy` and adds the resulting campaign to the user's campaign list.

#### Scenario: User clicks Copy

- **Given** the catalog shows a template
- **When** the user clicks the "Copy" button on that template
- **Then** a POST request is made to `/api/campaigns/global/[template.id]/copy`
- **And** on success the new campaign appears in the user's campaign list above the catalog
- **And** the copy button returns to its default state

#### Scenario: Copy in progress shows loading state

- **Given** the user has clicked Copy on a template
- **When** the POST request is in flight
- **Then** the Copy button is disabled and shows a loading indicator

#### Scenario: Copy failure shows error

- **Given** the POST request fails (network error or server error)
- **When** the error is returned
- **Then** an inline error message is displayed near the template entry
- **And** the user can retry

---

### Requirement: ADDED CampaignEditor handles chapters array

The system SHALL update `CampaignEditor` to display and edit the `chapters` array and `currentChapterId` instead of the removed `currentChapter` and `currentChapterOrder` fields.

#### Scenario: Create campaign with no chapters

- **Given** a user opens the CampaignEditor for a new campaign
- **When** they save without adding any chapters
- **Then** the campaign is saved with `chapters: []` and no `currentChapterId`

#### Scenario: Copied campaign shows chapter list in editor

- **Given** a user opens a copied campaign for editing
- **When** the editor renders
- **Then** the chapters list is visible and the current chapter (if set) is indicated

## MODIFIED Requirements

### Requirement: MODIFIED CampaignEditor no longer uses currentChapter / currentChapterOrder

The system SHALL remove the `currentChapter` text input and `currentChapterOrder` number input from `CampaignEditor`.

#### Scenario: Legacy fields are absent from the editor form

- **Given** the CampaignEditor renders
- **When** a user inspects the form fields
- **Then** no "Current Chapter" text input or "Chapter Order" number input is present

## REMOVED Requirements

### Requirement: REMOVED currentChapter and currentChapterOrder inputs from CampaignEditor

Reason for removal: These inputs correspond to the removed Campaign model fields. The new chapter structure is handled by `chapters[]` and `currentChapterId`.

## Traceability

- Proposal element "Campaign Catalog UI section below user campaigns" -> Requirement: ADDED Campaign Catalog section
- Proposal element "Copy button" -> Requirement: ADDED Copy button triggers template copy
- Proposal element "CampaignEditor updated" -> Requirements: ADDED chapters in editor, MODIFIED removes legacy inputs
- Design decision 1 (public GET feeds catalog) -> Requirement: ADDED Campaign Catalog section
- Design decision 3 (copy route) -> Requirement: ADDED Copy button
- Requirement ADDED Catalog section -> Task: Update app/campaigns/page.tsx
- Requirement ADDED Copy button -> Task: Add copy handler and loading/error state
- Requirement ADDED CampaignEditor chapters -> Task: Update CampaignEditor.tsx

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Catalog fetch does not block user campaigns render

- **Given** the campaign dashboard loads
- **When** the global templates fetch is in flight
- **Then** the user's own campaigns are visible immediately (catalog section shows a loading state, not the full page)

### Requirement: Security

#### Scenario: Copy button requires authenticated session

- **Given** an unauthenticated user somehow accesses the campaign dashboard
- **When** they click Copy
- **Then** the POST request returns `401` and an appropriate error is shown — no campaign is created

### Requirement: Reliability

#### Scenario: Catalog fetch failure does not crash the dashboard

- **Given** the `GET /api/campaigns/global` request fails
- **When** the error is received
- **Then** the user's own campaigns section still renders correctly
- **And** the catalog section shows an error state rather than a blank crash
