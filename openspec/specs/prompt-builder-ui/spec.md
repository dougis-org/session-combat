## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Prompt Builder accessible at `/campaigns/[id]/prompts`

The system SHALL render the Prompt Builder page when navigating to `/campaigns/[id]/prompts`, using the `campaignId` route param as the sole source of context.

#### Scenario: Page renders with campaign context loaded

- **Given** a campaign with id "camp-1", a linked party, and resolved characters
- **When** the user navigates to `/campaigns/camp-1/prompts`
- **Then** the page displays the campaign name in the heading
- **And** the template selector is visible

#### Scenario: Page accessible via nav link from campaign detail view

- **Given** the user is on the campaigns page viewing campaign "camp-1"
- **When** they click the "Prompt Builder" link
- **Then** they are navigated to `/campaigns/camp-1/prompts`

### Requirement: ADDED Template selector shows five tabs

The system SHALL display a tab/button for each template: NPC, Location, Shop, Magic Item, Room.

#### Scenario: First template selected by default

- **Given** the Prompt Builder page has loaded
- **When** no user interaction has occurred
- **Then** the NPC template tab is active and its fields are rendered

#### Scenario: Selecting a different template renders its fields

- **Given** the Prompt Builder page is loaded with the NPC tab active
- **When** the user clicks the "Room Description" tab
- **Then** the Room Description template's fields are rendered and NPC fields are no longer visible

### Requirement: ADDED "Generate Prompt" assembles and displays the prompt

The system SHALL assemble a `BuiltPrompt` from the current template, form fields, and campaign context, and display `fullText` in a read-only textarea.

#### Scenario: Generate with all required fields filled

- **Given** the NPC template is selected and all required fields are filled
- **When** the user clicks "Generate Prompt"
- **Then** a read-only textarea appears containing the full prompt text
- **And** the textarea content includes the campaign name, current chapter, and party member names

#### Scenario: Generate with missing required fields

- **Given** the NPC template is selected and a required field is empty
- **When** the user clicks "Generate Prompt"
- **Then** an inline validation message identifies the missing field
- **And** no prompt textarea is shown

### Requirement: ADDED "Copy to Clipboard" copies `fullText`

The system SHALL call `navigator.clipboard.writeText(fullText)` when the user clicks "Copy to Clipboard".

#### Scenario: Copy after successful generate

- **Given** a prompt has been generated and displayed
- **When** the user clicks "Copy to Clipboard"
- **Then** `navigator.clipboard.writeText` is called with the full prompt text
- **And** a brief visual confirmation ("Copied!") appears

### Requirement: ADDED "Save to Library" button is present but disabled (stub)

The system SHALL render a "Save to Library" button that is disabled with a tooltip indicating it requires the Content Library feature (#185).

#### Scenario: Save to Library stub visible

- **Given** a prompt has been generated
- **When** the user views the action buttons
- **Then** a "Save to Library" button is visible, disabled, and has a tooltip referencing the upcoming feature

### Requirement: ADDED Loading and error states displayed

The system SHALL show a loading indicator while `useCampaignContext` is resolving, and an error message if loading fails.

#### Scenario: Loading state

- **Given** the page has mounted and `useCampaignContext` is in-flight
- **When** the component renders
- **Then** a loading indicator is visible and the template form is not rendered

#### Scenario: Error state

- **Given** `useCampaignContext` returns a non-null `error`
- **When** the component renders
- **Then** an error message is displayed using the existing `ErrorBanner` component

## MODIFIED Requirements

No existing page requirements modified.

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element: route at `app/campaigns/[id]/prompts/page.tsx` → Requirement: ADDED page accessible at `/campaigns/[id]/prompts`
- Proposal element: template selector tabs → Requirement: ADDED template selector shows five tabs
- Proposal element: Generate + Copy → Requirements: ADDED Generate and ADDED Copy
- Proposal element: Save to Library stub → Requirement: ADDED Save to Library stub
- Design decision: Decision 5 (child route) → Requirement: ADDED page accessible at `/campaigns/[id]/prompts`
- Requirements → Tasks: Task group C in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Context loads without blocking form interaction

- **Given** the page has loaded and `useCampaignContext` has resolved
- **When** the user immediately clicks a template tab
- **Then** the tab switch is instant (no additional fetch required)

### Requirement: Security

#### Scenario: Unauthenticated access redirected

- **Given** an unauthenticated user
- **When** they navigate to `/campaigns/[id]/prompts`
- **Then** `ProtectedRoute` redirects them to the login page

### Requirement: Reliability

#### Scenario: No party linked to campaign — graceful message

- **Given** a campaign with no linked parties
- **When** the Prompt Builder page loads
- **Then** the template form is still accessible and an informational message notes that no party is linked; party context is omitted from generated prompts
