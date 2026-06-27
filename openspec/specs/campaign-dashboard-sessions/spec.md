# campaign-dashboard-sessions Specification

## Purpose
To ensure that campaign session entry points are always discoverable from the Active Campaigns Dashboard by rendering a 'Session Log' button in the campaign card action row and a session section (showing the last session or a 'Log First Session' CTA) on the active campaign card.
## Requirements
### Requirement: ADDED Session Log button in Active Campaigns action row

The system SHALL always render a "Session Log" link in the Active Campaigns Dashboard action button row for each active campaign, regardless of whether any sessions exist.

#### Scenario: Session Log button present with sessions

- **Given** the user is on the `/campaigns` page
- **When** at least one active campaign exists with one or more sessions logged
- **Then** the Active Campaigns Dashboard card for that campaign displays a "Session Log" button linking to `/campaigns/${campaignId}/sessions`

#### Scenario: Session Log button present with no sessions

- **Given** the user is on the `/campaigns` page
- **When** an active campaign exists but has no sessions logged
- **Then** the Active Campaigns Dashboard card for that campaign still displays a "Session Log" button linking to `/campaigns/${campaignId}/sessions`

---

### Requirement: ADDED Session section always renders on Active Campaign card

The system SHALL render a session section on every Active Campaigns Dashboard card: showing the last session details when sessions exist, or a "Log First Session" CTA when none exist.

#### Scenario: Last session shown when sessions exist

- **Given** the user is on the `/campaigns` page
- **When** an active campaign has at least one session (the most recent has `sessionNumber` N and optional `title`)
- **Then** the session section displays "Session #N" with the session title (if any), the date played, and a "View all sessions →" link to `/campaigns/${campaignId}/sessions`

#### Scenario: Empty state CTA shown when no sessions exist

- **Given** the user is on the `/campaigns` page
- **When** an active campaign has no sessions logged (`lastSession` is null)
- **Then** the session section displays "No sessions logged yet." and a "Log First Session →" link to `/campaigns/${campaignId}/sessions`

#### Scenario: Milestone badge shown on milestone sessions

- **Given** the user is on the `/campaigns` page
- **When** an active campaign's last session has `milestone: true`
- **Then** the session section displays a "Milestone" badge alongside the session info

