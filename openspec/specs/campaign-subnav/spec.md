# campaign-subnav Specification

## Purpose
To provide a consistent navigation header and tab bar (Members, Sessions, Prompts, Library) on all campaign sub-pages (`/campaigns/[id]/*`), with active tab highlighting based on the current route pathname, and a single continuous dark background surface owned by the shared layout.

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

### Requirement: Shared background surface across header, nav, content, and chat

The system SHALL render the campaign name header, the tab bar, the active sub-page's content (`{children}`), and the `CampaignChat` panel on one continuous dark background (`bg-gray-900`), owned by the shared layout (`app/campaigns/[id]/layout.tsx`), regardless of whether the chat panel is in its default or expanded (`isChatLarge`) state.

#### Scenario: Continuous background on default layout

- **Given** a user is on any campaign sub-page (`/campaigns/${id}`, `/campaigns/${id}/sessions`, `/campaigns/${id}/prompts`, `/campaigns/${id}/library`, or `/campaigns/${id}/combat`) with chat in its default (non-large) state
- **When** the layout renders
- **Then** the header, tab bar, and page content render with no visible background seam between them; the entire visible area uses the same `bg-gray-900` surface

#### Scenario: Continuous background with chat expanded

- **Given** a user is on any campaign sub-page with the chat panel expanded (`isChatLarge` is true)
- **When** the layout renders in its flex/side-by-side branch
- **Then** the header, tab bar, and page content within the `<main>` region still render on the same `bg-gray-900` surface with no visible seam

#### Scenario: Background does not depend on individual page content height

- **Given** a campaign sub-page whose content is shorter than the viewport (e.g., an empty Library page)
- **When** the layout renders
- **Then** the dark background still fills the full viewport height (via `min-h-screen` at the layout level), with no white gap below short content

---

### Requirement: Tab bar on campaign sub-pages

The system SHALL render a tab bar with four tabs — Members, Sessions, Prompts, Library — on all campaign sub-pages via the shared layout, with the active tab visually indicated by a solid filled-pill background (`bg-blue-600`) rather than a bottom-border underline, and legible against the shared `bg-gray-900` surface. Inactive tabs SHALL render as plain gray text with no background chip or border.

#### Scenario: All four tabs render on Members page

- **Given** a user is on `/campaigns/${id}` (Members page)
- **When** the layout renders
- **Then** four tabs are visible: Members, Sessions, Prompts, Library

#### Scenario: Active tab renders as a filled pill

- **Given** a user is on `/campaigns/${id}/prompts`
- **When** the layout renders
- **Then** the Prompts tab renders with a solid `bg-blue-600` background chip and white text, and is clearly legible against the surrounding `bg-gray-900` background

#### Scenario: Inactive tabs render as plain text with no chip or underline

- **Given** a user is on `/campaigns/${id}/prompts`
- **When** the layout renders
- **Then** the Members, Sessions, and Library tabs render as plain gray text with no background chip and no bottom-border underline

#### Scenario: Tab bar active-route matching is unchanged

- **Given** a user navigates between Members, Sessions, Prompts, and Library
- **When** the layout renders for each route
- **Then** exactly one tab is shown active at a time, using the same `pathname === ...` (Members) / `pathname.startsWith(...)` (Sessions, Prompts, Library) matching rules as before this change

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

### Requirement: Campaign sub-page layout wrapping

The system SHALL wrap all campaign sub-page content with the campaign name header and tab bar, in addition to the existing `CampaignChat` component already rendered by the layout, with the dark background/theme (`bg-gray-900 min-h-screen text-white`) owned exclusively by the shared layout rather than duplicated in each individual sub-page component.

#### Scenario: Sub-page content still renders below tab bar

- **Given** a user navigates to any campaign sub-page
- **When** the layout renders with the filled-pill tab bar
- **Then** the page's existing content (`{children}`) renders below the tab bar, and `CampaignChat` still renders

#### Scenario: Individual sub-pages no longer own their own background wrapper

- **Given** any of the five campaign sub-page components (`page.tsx`, `sessions/page.tsx`, `prompts/page.tsx`, `library/page.tsx`, `combat/page.tsx`)
- **When** the component renders
- **Then** it no longer renders its own `min-h-screen bg-gray-900 text-white` (or equivalent) outer wrapper, relying instead on the shared layout for that background

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element "Campaign name header in sub-nav" → Requirement: ADDED Campaign name header in sub-nav
- Proposal element "Tab bar Members | Sessions | Prompts | Library" → Requirement: Tab bar on campaign sub-pages
- Proposal element "Active tab via usePathname()" → Requirement: Tab bar on campaign sub-pages
- Proposal element "Centralize `bg-gray-900 min-h-screen text-white` in `layout.tsx`, remove from 5 page files" → Requirement: Shared background surface across header, nav, content, and chat; Campaign sub-page layout wrapping
- Proposal element "Restyle sub-nav tabs to filled-pill tabs" → Requirement: Tab bar on campaign sub-pages
- Design decision 3 (layout extension) → ADDED Campaign name header in sub-nav + Tab bar on campaign sub-pages
- Design decision 4 (pathname matching) → Tab bar on campaign sub-pages
- Requirements → Tasks: task-3 (update layout.tsx with name + tab bar); see [`tasks.md`](../../changes/archive/2026-07-09-fix-campaign-subnav-theming/tasks.md) for the background-centralization and tab-restyle tasks

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

See functional scenario "Header degrades gracefully on fetch failure" — tab bar renders even when campaign name is unavailable. See also "Background does not depend on individual page content height" — the shared background must not regress into a partial/seamed appearance regardless of per-page content length or chat panel state.
