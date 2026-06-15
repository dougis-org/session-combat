## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-14-campaign-layout-two-row-cards/design.md) document, not a replacement.

### Requirement FR1: Status chip is always visible alongside the campaign name

The system SHALL render the status chip in a dedicated header row alongside the campaign name, never in the same flex container as action buttons.

#### Scenario: Status chip renders beside campaign name

- **Given** a campaign card is rendered in the campaign list
- **When** the card is displayed
- **Then** the status chip text (e.g. "Active", "Planning", "On Hold", "Completed") is present in the document
- **And** the status chip is in the same row as the campaign name heading

#### Scenario: Status chip with long campaign name

- **Given** a campaign with a name longer than 60 characters
- **When** the card is rendered at any viewport width
- **Then** the status chip remains visible and is not pushed outside the card boundary
- **And** the campaign name truncates with an ellipsis

### Requirement FR2: Action buttons rendered below the header row, never overlapping it

The system SHALL render all action buttons/links in a dedicated action row beneath the campaign name and status chip.

#### Scenario: Action row present below header row

- **Given** a campaign card with action buttons (e.g. Members, Session Log, Edit, Delete)
- **When** the card is rendered
- **Then** all action buttons are present in the document
- **And** the action row appears after (below) the header row in DOM order

#### Scenario: Many action buttons do not overflow

- **Given** a campaign card in the active campaigns section with 4 action links
- **When** the card is rendered
- **Then** all 4 action links are accessible (not clipped, not hidden)
- **And** if they wrap to a second line, they do not overlap the header row content

### Requirement FR3: Long campaign names truncate gracefully

The system SHALL truncate campaign title text with an ellipsis when the title exceeds the available width, rather than pushing adjacent elements out of position.

#### Scenario: Title truncation class applied

- **Given** a campaign card is rendered
- **When** the title element is inspected
- **Then** the title element has the `truncate` CSS class (or equivalent overflow ellipsis behavior)
- **And** it has `min-w-0` to allow flex truncation to engage

### Requirement FR4: All existing action links and buttons remain functional

The system SHALL preserve all existing action links and buttons in the action row with no change to their href, onClick, or disabled behavior.

#### Scenario: Campaign list action buttons

- **Given** a campaign card in the all-campaigns list
- **When** the Edit button is clicked
- **Then** the campaign editor is opened with the correct campaign data

#### Scenario: Campaign list delete

- **Given** a campaign card in the all-campaigns list
- **When** the Delete button is clicked
- **Then** a confirmation dialog is shown

#### Scenario: Active campaigns action links

- **Given** an active campaign card in the dashboard section
- **When** the Members link is clicked
- **Then** navigation to `/campaigns/{id}` is triggered

## MODIFIED Requirements

### Requirement: MODIFIED Campaign card DOM structure

The existing single-row `flex justify-between` layout for campaign cards SHALL be replaced with a two-row stacked layout in both the campaign list section and the active campaigns section of `app/campaigns/page.tsx`.

#### Scenario: Old single-row replaced by two-row

- **Given** the campaign list renders a campaign card
- **When** the card DOM is inspected
- **Then** there is no single flex container that holds both the status chip and action buttons as siblings

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element "status chip collides with action buttons" -> FR1, FR2
- Proposal element "long campaign names overflow" -> FR3
- Proposal element "all existing actions preserved" -> FR4
- Design Decision 1 (two-row layout) -> FR2, Modified requirement
- Design Decision 2 (header row structure) -> FR1, FR3
- Design Decision 3 (action row structure) -> FR2, FR4
- Design Decision 4 (both card contexts) -> All FRs apply to both sections
- FR1 -> Tasks: Refactor campaign list card header, Refactor active campaigns card header
- FR2 -> Tasks: Refactor campaign list card actions, Refactor active campaigns card actions
- FR3 -> Tasks: Refactor campaign list card header
- FR4 -> Tasks: Update CampaignsPage unit tests

## Non-Functional Acceptance Criteria

### Requirement: Performance

No performance budget changes. This is a pure DOM restructure with no new rendering work.

### Requirement: Security

No security surface changes. See functional scenarios — no access control is altered.

### Requirement: Reliability

#### Scenario: No new dependencies

- **Given** the change is implemented
- **When** `git diff package.json package-lock.json` is inspected
- **Then** no new packages have been added or version-bumped as a result of this change

#### Scenario: Existing unit tests pass

- **Given** the layout refactor is applied
- **When** `npm run test:unit` is executed
- **Then** all tests pass with no new failures
