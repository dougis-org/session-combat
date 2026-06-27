# campaign-subnav Specification

## Purpose
To provide a consistent navigation header and tab bar (Members, Sessions, Prompts, Library) on all campaign sub-pages (`/campaigns/[id]/*`), with active tab highlighting based on the current route pathname.

## Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-27-campaign-session-access/design.md) document, not a replacement.

### Requirement: ADDED Campaign name header in sub-nav

The system SHALL display the campaign name as a header above the tab bar on all campaign sub-pages (`/campaigns/[id]/*`), fetched from the existing `/api/campaigns/${id}` response.

#### Scenario: Campaign name shown in header

- **Given** a user navigates to any campaign sub-page (Members, Sessions, Prompts, or Library)
- **When** the layout mounts and the `/api/campaigns/${id}` fetch succeeds
- **Then** the campaign name is displayed as a visible header above the tab bar

#### Scenario: Header degrades gracefully on fetch failure

- **Given** a user navigates to any campaign sub-page
- **When** the `/api/campaigns/${id}` fetch fails or returns no name
- **Then** the tab bar still renders without an error; the name area is empty or omitted

---

### Requirement: ADDED Tab bar on campaign sub-pages

The system SHALL render a tab bar with four tabs — Members, Sessions, Prompts, Library — on all campaign sub-pages via the shared layout, with the active tab highlighted based on the current pathname.

#### Scenario: All four tabs render on Members page

- **Given** a user is on `/campaigns/${id}` (Members page)
- **When** the layout renders
- **Then** four tabs are visible: Members, Sessions, Prompts, Library

#### Scenario: Members tab is active on Members page

- **Given** a user is on `/campaigns/${id}` (exact path, Members page)
- **When** the layout renders
- **Then** the Members tab is visually highlighted as active; Sessions, Prompts, Library are not

#### Scenario: Sessions tab is active on Sessions page

- **Given** a user is on `/campaigns/${id}/sessions`
- **When** the layout renders
- **Then** the Sessions tab is visually highlighted as active; Members, Prompts, Library are not

#### Scenario: Prompts tab is active on Prompts page

- **Given** a user is on `/campaigns/${id}/prompts`
- **When** the layout renders
- **Then** the Prompts tab is visually highlighted as active; Members, Sessions, Library are not

#### Scenario: Library tab is active on Library page

- **Given** a user is on `/campaigns/${id}/library`
- **When** the layout renders
- **Then** the Library tab is visually highlighted as active; Members, Sessions, Prompts are not

#### Scenario: Sessions tab active on nested session routes

- **Given** a user is on a path starting with `/campaigns/${id}/sessions/` (e.g., a future sub-route)
- **When** the layout renders
- **Then** the Sessions tab is visually highlighted as active (via `startsWith` matching)

#### Scenario: Tab links navigate to correct routes

- **Given** a user is on any campaign sub-page
- **When** they click the Sessions tab
- **Then** they navigate to `/campaigns/${id}/sessions`

- **When** they click the Prompts tab
- **Then** they navigate to `/campaigns/${id}/prompts`

- **When** they click the Library tab
- **Then** they navigate to `/campaigns/${id}/library`

- **When** they click the Members tab
- **Then** they navigate to `/campaigns/${id}`

### Requirement: ADDED Campaign sub-page layout wrapping

The system SHALL wrap all campaign sub-page content with the campaign name header and tab bar, in addition to the existing `CampaignChat` component already rendered by the layout.

#### Scenario: Sub-page content still renders below tab bar

- **Given** a user navigates to any campaign sub-page
- **When** the layout renders with the new tab bar
- **Then** the page's existing content (`{children}`) renders below the tab bar, and `CampaignChat` still renders

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element "Campaign name header in sub-nav" → Requirement: ADDED Campaign name header in sub-nav
- Proposal element "Tab bar Members | Sessions | Prompts | Library" → Requirement: ADDED Tab bar on campaign sub-pages
- Proposal element "Active tab via usePathname()" → Requirement: ADDED Tab bar on campaign sub-pages
- Design decision 3 (layout extension) → ADDED Campaign name header in sub-nav + ADDED Tab bar on campaign sub-pages
- Design decision 4 (pathname matching) → ADDED Tab bar on campaign sub-pages
- Requirements → Tasks: task-3 (update layout.tsx with name + tab bar)

## Non-Functional Acceptance Criteria

### Requirement: Performance

No additional network requests. The campaign name is read from the existing `/api/campaigns/${id}` fetch already present in the layout.

#### Scenario: Single fetch for both name and activeSessionId

- **Given** a user navigates to any campaign sub-page
- **When** the layout mounts
- **Then** exactly one fetch to `/api/campaigns/${id}` is made (same as before), and both `name` and `activeSessionId` are read from the single response

### Requirement: Security

All tab bar links point to existing ProtectedRoute-wrapped pages. No new access-controlled surfaces are introduced.

See functional scenarios above for navigation behavior.

### Requirement: Reliability

See functional scenario "Header degrades gracefully on fetch failure" — tab bar renders even when campaign name is unavailable.
