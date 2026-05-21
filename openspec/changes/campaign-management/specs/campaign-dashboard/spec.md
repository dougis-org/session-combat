## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Campaign Dashboard page

The system SHALL provide a Campaign Dashboard at `app/campaigns/page.tsx` as the app's primary landing page, displaying all of the user's campaigns with inline create, edit, and delete functionality.

#### Scenario: Dashboard shows all campaigns

- **Given** an authenticated user with three campaigns
- **When** they navigate to the Campaign Dashboard
- **Then** all three campaigns are displayed, each showing name, moduleName, currentChapter, and active state

#### Scenario: Empty state with CTA

- **Given** an authenticated user with no campaigns
- **When** they navigate to the Campaign Dashboard
- **Then** an empty-state message and a "New Campaign" call-to-action button are displayed

#### Scenario: Creating a campaign from the dashboard

- **Given** an authenticated user on the Campaign Dashboard
- **When** they fill in the new campaign form (name required; module, chapter, order, active optional) and submit
- **Then** the new campaign appears in the list without a full page reload

#### Scenario: Editing a campaign inline

- **Given** a campaign displayed on the dashboard
- **When** the user edits any field and saves
- **Then** the campaign row updates to reflect the changes

#### Scenario: Deleting a campaign from the dashboard

- **Given** a campaign displayed on the dashboard
- **When** the user deletes it (with a confirmation prompt)
- **Then** the campaign is removed from the list

### Requirement: ADDED Campaign Dashboard as app landing page

The system SHALL use `app/campaigns/page.tsx` as the default route, replacing the previous landing page.

#### Scenario: Root route navigates to Campaign Dashboard

- **Given** an authenticated user
- **When** they navigate to the app root `/`
- **Then** they land on the Campaign Dashboard

### Requirement: ADDED "Campaigns" as first nav item

The system SHALL render "Campaigns" as the first navigation link in `app/layout.tsx`.

#### Scenario: Campaigns is first in nav

- **Given** any authenticated page
- **When** the navigation is rendered
- **Then** "Campaigns" is the first nav link, preceding all other links

## MODIFIED Requirements

### Requirement: MODIFIED Default landing page

The system SHALL redirect or render the Campaign Dashboard for the root route (previously the encounters or another page).

#### Scenario: Old default route no longer renders the previous page

- **Given** an authenticated user
- **When** they navigate to the app root
- **Then** they see the Campaign Dashboard, not the previous default page

## REMOVED Requirements

_None._

## Traceability

- Proposal element "Campaign Dashboard as landing page + first nav" → Requirement: Campaign Dashboard page + nav
- Design decision 4 → all dashboard and nav scenarios
- Requirement → Tasks: campaign dashboard page task, layout nav update task

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Dashboard requires authentication

- **Given** an unauthenticated visitor
- **When** they navigate to `/campaigns` or `/`
- **Then** they are redirected to the login page (or shown an auth error), not the dashboard
