## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Active Campaigns dashboard section

The system SHALL render an Active Campaigns section at the top of `/campaigns`, above the existing management list, containing one campaign card per campaign where `active === true`.

#### Scenario: Multiple active campaigns shown

- **Given** the user has two campaigns with `active: true` and one with `active: false`
- **When** the user visits `/campaigns`
- **Then** two campaign cards are rendered in the Active Campaigns section and zero cards for the inactive campaign

#### Scenario: No active campaigns — CTA card

- **Given** the user has no campaigns with `active: true`
- **When** the user visits `/campaigns`
- **Then** the Active Campaigns section renders a single CTA card with text directing the user to mark a campaign active or create one, and no campaign cards are rendered

#### Scenario: Existing management list unchanged

- **Given** any state of active/inactive campaigns
- **When** the user visits `/campaigns`
- **Then** the existing campaign management list (all campaigns, create/edit/delete, catalog) is visible below the dashboard section and fully functional

### Requirement: ADDED Campaign card content

The system SHALL render each active campaign card with: campaign name, module/chapter info (`CampaignChapterInfo`), all linked party sub-cards, Last Session card (conditional), and quick-action buttons for Prompt Builder and Encounters.

#### Scenario: Campaign card renders header and actions

- **Given** an active campaign with `moduleName` set and `currentChapterId` pointing to a valid chapter
- **When** the dashboard renders
- **Then** the card shows the campaign name, module name, current chapter title, a "Open Prompt Builder" link to `/prompts`, and a "Start Encounter" link to `/encounters`

#### Scenario: Campaign with no linked party shows empty state

- **Given** an active campaign with no party where `party.campaignId === campaign.id`
- **When** the dashboard renders
- **Then** the party section of the card shows an empty state with a link to `/parties`

### Requirement: ADDED Party sub-cards with member grouping

The system SHALL render a party sub-card for each party linked to the active campaign, showing active members (`members.filter(m => !m.leftAt)`) split into Player Characters and Travelling NPCs & Companions sections. Sections with zero members are hidden.

#### Scenario: Members split by characterType

- **Given** a party with two members where `characterType === 'character'` and one member where `characterType === 'npc'`
- **When** the party sub-card renders
- **Then** the Player Characters section shows two `CharacterRosterCard` entries and the Travelling NPCs & Companions section shows one entry

#### Scenario: Departed members excluded

- **Given** a party with one active member (`leftAt` undefined) and one departed member (`leftAt` set)
- **When** the party sub-card renders
- **Then** only the active member appears; the departed member is not rendered

#### Scenario: PC section hidden when no PCs

- **Given** a party with only NPC members (all `characterType === 'npc'`)
- **When** the party sub-card renders
- **Then** the Player Characters section is not rendered; only the Travelling NPCs & Companions section is visible

## MODIFIED Requirements

### Requirement: MODIFIED campaigns page data fetching

The system SHALL fetch campaigns, parties, and characters in parallel on page load rather than fetching only campaigns and templates sequentially.

#### Scenario: All three fetches fire in parallel

- **Given** the user visits `/campaigns`
- **When** the page mounts
- **Then** `fetch('/api/campaigns')`, `fetch('/api/parties')`, `fetch('/api/characters')`, and `fetch('/api/campaigns/global')` are all initiated before any one resolves

## REMOVED Requirements

No requirements removed by this change.

## Traceability

- Proposal: "Top of the campaigns page shows all active campaigns at a glance" → Requirement: Active Campaigns dashboard section
- Proposal: "All parties linked to an active campaign are listed within its card" → Requirement: Party sub-cards with member grouping
- Proposal: "No active campaigns → CTA" → Requirement: Active Campaigns dashboard section (empty state scenario)
- Design Decision 3 (parallel fetch) → Requirement: MODIFIED campaigns page data fetching
- Design Decision 5 (PC vs NPC grouping) → Requirement: Party sub-cards with member grouping
- Requirements → Tasks: tasks.md — Task 3 (page fetch), Task 4 (dashboard UI)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Main render not blocked by session data

- **Given** the active campaigns dashboard has rendered
- **When** the secondary session fetch has not yet resolved
- **Then** campaign cards, party sub-cards, and roster cards are all visible; the Last Session card area is simply absent (not a loading spinner or error)

### Requirement: Reliability

#### Scenario: Session fetch failure does not break dashboard

- **Given** `GET /api/campaigns/[id]/sessions?limit=1` returns a network error or 500
- **When** the secondary useEffect processes the response
- **Then** the Last Session card is absent for that campaign; no error boundary is triggered; other campaign cards are unaffected
