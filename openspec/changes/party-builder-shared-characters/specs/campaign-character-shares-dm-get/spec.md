## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED `GET /api/campaigns/[id]/characters` — role-aware response

The system SHALL return an enriched `SharedCharacterEntry[]` response (including character metadata) when the authenticated caller is a DM of the campaign, and SHALL return the existing bare-share list for player callers.

`SharedCharacterEntry`:
```ts
interface SharedCharacterEntry {
  share: CampaignCharacterShare;
  character: Pick<Character, 'id' | 'name' | 'characterType' | 'userId' | 'deletedAt'>;
}
```

#### Scenario: DM receives enriched share list

- **Given** campaign `C` has two active player members P1 and P2, each having shared one character
- **When** the DM calls `GET /api/campaigns/C/characters`
- **Then** the response is HTTP 200 with a JSON array of two `SharedCharacterEntry` objects, each containing both the share record and the character's `id`, `name`, `characterType`, `userId`, and `deletedAt` fields

#### Scenario: DM receives only active-member shares

- **Given** campaign `C` has player P1 (active, shared character X) and player P2 (status `removed`, shared character Y)
- **When** the DM calls `GET /api/campaigns/C/characters`
- **Then** the response contains only the entry for character X; character Y is excluded because P2 is not an active member

#### Scenario: Soft-deleted character excluded from DM list

- **Given** player P1 has shared character X into campaign `C`, and character X has `deletedAt` set
- **When** the DM calls `GET /api/campaigns/C/characters`
- **Then** the response does not include character X

#### Scenario: Player receives own shares only (unchanged)

- **Given** player P1 has shared characters A and B into campaign `C`; player P2 has shared character C
- **When** P1 calls `GET /api/campaigns/C/characters`
- **Then** the response contains only P1's shares (characters A and B), in the existing bare-share format (not `SharedCharacterEntry`)

#### Scenario: Non-member receives 403

- **Given** user U is not a member of campaign `C`
- **When** U calls `GET /api/campaigns/C/characters`
- **Then** the response is HTTP 403

#### Scenario: Invited (non-active) member receives 403

- **Given** user U has `status: 'invited'` in campaign `C`
- **When** U calls `GET /api/campaigns/C/characters`
- **Then** the response is HTTP 403

## Traceability

- Proposal element "Extend GET /api/campaigns/[id]/characters — DM gets enriched view" → Requirement: MODIFIED GET route
- Design decision 1 (enriched DM GET) → Requirement: MODIFIED GET route
- Design decision 3 (`listAllSharesForCampaign`) → used by the DM GET path
- Design decision 7 (`SharedCharacterEntry` type) → shapes the DM response
- Requirement → Task: "Extend GET /api/campaigns/[id]/characters for DM role"

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios: "Non-member receives 403", "Invited member receives 403", "Player receives own shares only".

No distinct NFAC security scenarios — all access-control cases are fully covered by the functional scenarios above.
