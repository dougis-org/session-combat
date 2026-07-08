# campaign-subnav Specification (Delta)

This document details *changes* to requirements and is additive to the
[`design.md`](../../design.md) document, not a replacement. It modifies
requirements previously established in
[`openspec/specs/campaign-subnav/spec.md`](../../../../specs/campaign-subnav/spec.md).

## ADDED Requirements

### Requirement: ADDED Shared background surface across header, nav, content, and chat

The system SHALL render the campaign name header, the tab bar, the active sub-page's content (`{children}`), and the `CampaignChat` panel on one continuous dark background (`bg-gray-900`), owned by the shared layout (`app/campaigns/[id]/layout.tsx`), regardless of whether the chat panel is in its default or expanded (`isChatLarge`) state.

#### Scenario: Continuous background on default layout

- **Given** a user is on any campaign sub-page (`/campaigns/[id]`, `/sessions`, `/prompts`, or `/library`) with chat in its default (non-large) state
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

## MODIFIED Requirements

### Requirement: MODIFIED Tab bar on campaign sub-pages

The system SHALL render a tab bar with four tabs — Members, Sessions, Prompts, Library — on all campaign sub-pages via the shared layout, with the active tab visually indicated by a solid filled-pill background (`bg-blue-600`) rather than a bottom-border underline, and legible against the shared `bg-gray-900` surface. Inactive tabs SHALL render as plain gray text with no background chip or border.

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

### Requirement: MODIFIED Campaign sub-page layout wrapping

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

- Proposal element "Centralize `bg-gray-900 min-h-screen text-white` in `layout.tsx`, remove from 5 page files" → Requirement: ADDED Shared background surface across header, nav, content, and chat; MODIFIED Campaign sub-page layout wrapping
- Proposal element "Restyle sub-nav tabs to filled-pill tabs" → Requirement: MODIFIED Tab bar on campaign sub-pages
- Design decision 1 (move background wrapper to layout.tsx) → MODIFIED Campaign sub-page layout wrapping
- Design decision 2 (background in both isChatLarge branches) → ADDED Shared background surface across header, nav, content, and chat
- Design decision 3 (filled-pill tab styling) → MODIFIED Tab bar on campaign sub-pages
- Design decision 4 (combat/page.tsx loading-state background removal) → MODIFIED Campaign sub-page layout wrapping (scenario: individual sub-pages no longer own their own background wrapper)
- Requirements → Tasks: see `tasks.md` (per-file wrapper removal tasks, tab restyle task, both-branch verification task)

## Non-Functional Acceptance Criteria

### Requirement: Performance

No additional network requests. This change is CSS/JSX structure only; the existing single fetch to `/api/campaigns/${id}` for name and `activeSessionId` is unaffected.

#### Scenario: Fetch behavior unchanged

- **Given** a user navigates to any campaign sub-page
- **When** the layout mounts
- **Then** exactly one fetch to `/api/campaigns/${id}` is made, same as before this change (see `openspec/specs/campaign-subnav/spec.md`, "Single fetch for both name and activeSessionId")

### Requirement: Reliability

See functional scenario "Background does not depend on individual page content height" above — the shared background must not regress into a partial/seamed appearance regardless of per-page content length or chat panel state.
