## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Show in-progress campaign banner

The system SHALL show a dismissible banner on the ad hoc combat setup screen if the current user has at least one active campaign.

#### Scenario: One active campaign

- **Given** the user navigates to the ad hoc combat setup screen (`/combat`)
- **And** the user has exactly one campaign with `status === 'active'`
- **And** the user has not dismissed the banner in the current session
- **When** the page renders
- **Then** a banner is displayed indicating the active campaign
- **And** the banner contains a link to `/campaigns/[id]/combat`
- **And** the banner contains a dismiss button

#### Scenario: Multiple active campaigns

- **Given** the user navigates to the ad hoc combat setup screen (`/combat`)
- **And** the user has multiple campaigns with `status === 'active'`
- **And** the user has not dismissed the banner in the current session
- **When** the page renders
- **Then** a banner is displayed indicating there are in-progress campaigns
- **When** the user clicks the banner link
- **Then** a modal opens showing the list of active campaigns, each linking to its respective combat page

#### Scenario: Banner dismissal

- **Given** the banner is displayed
- **When** the user clicks the dismiss button
- **Then** the banner disappears
- **And** a session storage flag `dismissed-campaign-banner` is set to true
- **And** upon reloading the page within the same session, the banner does not reappear

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element: Dismissible banner for active campaigns
  - Design decision: `<ActiveCampaignBanner />` component fetching campaigns.
  - Requirement: ADDED Show in-progress campaign banner
- Proposal element: Multiple active campaigns
  - Design decision: Modal for multiple campaigns inside `<ActiveCampaignBanner />`.
  - Requirement: ADDED Show in-progress campaign banner
- Proposal element: Session-local dismiss
  - Design decision: `sessionStorage.setItem('dismissed-campaign-banner', 'true')`
  - Requirement: ADDED Show in-progress campaign banner

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Fetch failure handling

- **Given** the user navigates to `/combat`
- **When** the `/api/campaigns` fetch fails or times out
- **Then** the banner silently fails to render
- **And** the ad hoc combat setup rendering is not blocked or disrupted
