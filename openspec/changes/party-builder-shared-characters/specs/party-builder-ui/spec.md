## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED `PartyEditor` — surfaces shared characters when campaign is selected

The system SHALL show a second character group ("Shared by Campaign Members") in the `PartyEditor` when a `campaignId` is selected. Shared characters SHALL be grouped by owner, exclude soft-deleted characters, and be selectable alongside DM-owned characters. When no `campaignId` is selected, only DM-owned characters SHALL be shown (existing behavior).

#### Scenario: Shared characters shown when campaignId selected

- **Given** the DM opens `PartyEditor` for a party in campaign `C`; player P1 has shared characters A and B into `C`
- **When** the editor renders
- **Then** a "Shared by Campaign Members" section is visible; characters A and B appear grouped under P1's identifier; each has a checkbox

#### Scenario: Shared characters grouped by owner

- **Given** campaign `C` has two players P1 (shared X) and P2 (shared Y and Z)
- **When** the DM opens `PartyEditor` for a party in `C`
- **Then** X is listed under P1's group; Y and Z are listed under P2's group

#### Scenario: Soft-deleted shared character not shown

- **Given** player P1 has shared character X into campaign `C`; X has `deletedAt` set
- **When** the DM opens `PartyEditor` for a party in `C`
- **Then** character X does not appear in the shared character section

#### Scenario: No shared characters section when no campaignId

- **Given** the party has no `campaignId` (or `campaignId` is empty)
- **When** the DM opens `PartyEditor`
- **Then** only DM-owned characters are shown; no "Shared by Campaign Members" section is rendered

#### Scenario: Shared character selected and saved

- **Given** character X is shared into campaign `C` and the DM checks X in `PartyEditor`
- **When** the DM saves the party
- **Then** the `PUT /api/parties/[id]` request includes X in `characterIds`; the party is saved successfully

#### Scenario: Previously selected shared character deselected

- **Given** party P has active member X (a shared character)
- **When** the DM unchecks X and saves
- **Then** the PUT request does not include X; `leftAt` is set on X's party member entry

#### Scenario: Loading state while shared characters fetch

- **Given** the DM opens `PartyEditor` for a campaign party
- **When** the `GET /api/campaigns/[id]/characters` fetch is in progress
- **Then** the shared characters section shows a loading indicator (or is absent until resolved)

## Traceability

- Proposal element "PartyEditor surfaces shared characters grouped by owner" → Requirement: MODIFIED PartyEditor
- Design decision 1 (enriched DM GET) → used by PartyEditor to populate shared character list
- Design decision 7 (`SharedCharacterEntry` type) → PartyEditor imports and uses this type
- Requirement → Task: "Update PartyEditor to fetch and render shared characters"

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenario: "No shared characters section when no campaignId". The UI only fetches and renders shared characters when a campaign is explicitly associated — no shared character data is surfaced in non-campaign contexts.
