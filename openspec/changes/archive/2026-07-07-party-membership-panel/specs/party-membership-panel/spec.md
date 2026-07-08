## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Per-party character membership panel on the campaign page

The system SHALL render one membership panel per party in the current campaign on the campaign page, each showing a multi-select of the current player's own characters, allowing the player to independently toggle their characters' active membership in that specific party.

#### Scenario: Panel renders one section per party

- **Given** a campaign with parties P1 and P2, and the current player is an active member of the campaign
- **When** the player views the campaign page
- **Then** two membership panel sections are rendered, one for P1 and one for P2

#### Scenario: Player adds own character to a party

- **Given** the player owns character X, which is not currently an active member of party P1
- **When** the player checks X's checkbox in P1's panel
- **Then** a `PUT /api/campaigns/{id}/members/{myUserId}/parties/{P1}` request is sent including X in `characterIds`, and X's checkbox reflects the checked state

#### Scenario: Player removes own character from a party

- **Given** the player owns character X, which is currently an active member of party P1
- **When** the player unchecks X's checkbox in P1's panel
- **Then** a `PUT /api/campaigns/{id}/members/{myUserId}/parties/{P1}` request is sent with `characterIds` excluding X, and X's checkbox reflects the unchecked state

#### Scenario: Multi-party membership is independent

- **Given** the player owns character X, active in party P1 but not in party P2
- **When** the player views the campaign page
- **Then** X's checkbox is checked in P1's panel and unchecked in P2's panel

#### Scenario: Toggling in one party does not affect another

- **Given** the player owns character X, active in both P1 and P2
- **When** the player unchecks X in P1's panel
- **Then** only the P1 request is sent; X remains checked in P2's panel and no request is sent for P2

#### Scenario: Toggle failure reverts UI state

- **Given** the player unchecks character X in party P1's panel
- **When** the resulting PUT request fails (non-2xx response or network error)
- **Then** X's checkbox reverts to its previous (checked) state

#### Scenario: Player has no characters

- **Given** the player owns zero characters
- **When** the player views a party's panel
- **Then** the panel shows a message indicating there are no characters to add, and no checkboxes are rendered

#### Scenario: Campaign has no parties

- **Given** the campaign has zero parties
- **When** the player views the campaign page
- **Then** no membership panel sections are rendered (or an empty-state message is shown)

## Traceability

- Proposal element -> Requirement: New UI section, one panel per party, wired to existing PUT endpoint -> ADDED Per-party character membership panel on the campaign page
- Design decision -> Requirement: Decisions 2 & 3 -> ADDED Per-party character membership panel on the campaign page
- Requirement -> Task(s): See `tasks.md` in `party-membership-panel`.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** a campaign page load under normal conditions
- **When** the campaign's parties are fetched to render the panels
- **Then** the parties list request completes within 500ms under normal load

### Requirement: Security

See functional scenarios in [`specs/party-management/spec.md`](../party-management/spec.md): "Non-member denied", "Inactive member denied". The panel itself performs no authorization decisions client-side; all access control is enforced server-side by the GET and PUT endpoints.

### Requirement: Reliability

See functional scenario above: "Toggle failure reverts UI state".
