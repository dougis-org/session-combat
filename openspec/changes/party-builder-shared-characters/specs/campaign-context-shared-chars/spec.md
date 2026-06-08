## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED `fetchCampaignContext` — includes shared player characters

The system SHALL include shared player characters in `CampaignContext.characters` when those characters are active party members in the campaign. Shared characters SHALL be fetched from `GET /api/campaigns/[id]/characters` (DM-enriched response) and merged with DM-owned characters. The function SHALL also apply a reactive guard: any non-DM-owned character whose `characterId` is not present in the current active shares list is excluded from `characters`, regardless of party membership.

#### Scenario: Shared character in active party appears in context

- **Given** player P1 has shared character X into campaign `C`; party P in `C` has X as an active member (no `leftAt`)
- **When** `fetchCampaignContext('C')` is called by the DM
- **Then** `context.characters` includes character X

#### Scenario: DM-owned character in party still appears (no regression)

- **Given** party P in campaign `C` has DM-owned character Y as an active member
- **When** `fetchCampaignContext('C')` is called
- **Then** `context.characters` includes character Y

#### Scenario: Reactive guard excludes character with revoked share

- **Given** character X was added to party P in campaign `C`; the share for X has since been deleted (X is not in the active shares list), but `leftAt` was not set (proactive cleanup failed)
- **When** `fetchCampaignContext('C')` is called
- **Then** `context.characters` does NOT include character X

#### Scenario: Soft-deleted shared character excluded

- **Given** character X is shared into campaign `C` and is an active party member, but has `deletedAt` set
- **When** `fetchCampaignContext('C')` is called
- **Then** `context.characters` does NOT include character X

#### Scenario: Shared character with leftAt is excluded

- **Given** character X was a shared party member but now has `leftAt` set on the party member entry
- **When** `fetchCampaignContext('C')` is called
- **Then** `context.characters` does NOT include character X (filtered out by existing `leftAt` logic)

#### Scenario: Context fetch is parallel (no sequential dependency)

- **Given** `fetchCampaignContext` is called
- **When** the function executes
- **Then** `GET /api/campaigns/[id]/characters` is fetched in the same `Promise.all` as `GET /api/parties` and `GET /api/characters`; no sequential blocking between the three fetches

## Traceability

- Proposal element "fetchCampaignContext merges shared characters + reactive guard" → Requirement: MODIFIED fetchCampaignContext
- Design decision 6 (reactive guard) → Requirement: reactive guard excludes revoked-share characters
- Requirement → Task: "Update fetchCampaignContext to include shared characters and apply reactive guard"

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No additional sequential round-trips added

- **Given** `fetchCampaignContext` is called
- **When** network requests are observed
- **Then** the shared-character fetch (`GET /api/campaigns/[id]/characters`) executes in parallel with the existing fetches; total context load time increases only by the max of (shared-char fetch latency vs. existing parallel fetches), not by an additive sequential latency

### Requirement: Reliability

#### Scenario: Shared-character fetch failure degrades gracefully

- **Given** `GET /api/campaigns/[id]/characters` returns a non-OK response
- **When** `fetchCampaignContext` processes the result
- **Then** `context.characters` contains only DM-owned characters (degraded mode); the function does not throw; an error is logged
