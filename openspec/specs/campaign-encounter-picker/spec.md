## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-24-scope-campaign-encounter-picker/design.md) document, not a replacement.

### Requirement: ADDED Empty state for campaign combat setup without linked encounters

The system SHALL display an actionable empty state with a link to manage encounters when a campaign combat setup is initialized and no encounters are linked to the campaign.

#### Scenario: Campaign has zero linked encounters
- **Given** a campaign exists with zero linked encounters
- **When** the user navigates to the combat setup page for that campaign
- **Then** the "From Library" panel displays a message indicating no encounters are linked
- **And** the panel displays a link pointing to the campaign's encounters management page
- **And** the standard encounter dropdown is hidden

## MODIFIED Requirements

### Requirement: MODIFIED Scope combat setup encounters to campaign

The system SHALL scope the encounters fetched and displayed in the combat setup view to only those linked to the current campaign, if a campaign context is provided.

#### Scenario: Starting combat from a campaign
- **Given** a user has multiple encounters across different campaigns
- **When** they load the combat setup view with a `campaignId` provided
- **Then** `useCombat` fetches `/api/campaigns/${campaignId}/encounters`
- **And** the "From Library" dropdown only lists the encounters linked to that campaign

#### Scenario: Starting ad-hoc combat (no campaign)
- **Given** a user has multiple encounters across different campaigns
- **When** they load the global ad-hoc combat setup view without a `campaignId`
- **Then** `useCombat` fetches `/api/encounters`
- **And** the "From Library" dropdown lists all encounters owned by the user

## REMOVED Requirements

None

## Traceability

- Proposal element -> Requirement: Fetch `/api/campaigns/${campaignId}/encounters` when `campaignId` is present -> MODIFIED Scope combat setup encounters to campaign
- Proposal element -> Requirement: Display an empty state with a link when zero encounters are linked -> ADDED Empty state for campaign combat setup without linked encounters
- Design decision -> Requirement: Decision 1: Conditional Data Fetching in `useCombat` -> MODIFIED Scope combat setup encounters to campaign
- Design decision -> Requirement: Decision 2: Empty State UI in `CombatSetupView` -> ADDED Empty state for campaign combat setup without linked encounters

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: API Fetch behavior

- **Given** the component is mounting
- **When** `useCombat` initializes
- **Then** it makes exactly one fetch call to the appropriate encounters API endpoint

### Requirement: Operability

#### Scenario: Missing encounter data grace

- **Given** the API returns an unexpected error or null for encounters
- **When** the `CombatSetupView` renders
- **Then** the application does not crash
- **And** an appropriate fallback or error state is shown
