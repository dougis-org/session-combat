## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Linked-encounter cards show the encounter's monster roster

The system SHALL render, for each linked encounter on `app/campaigns/[id]/encounters/page.tsx`, the encounter's monster roster and monster count, using the same presentation as the global `/encounters` list (a "Monsters (N)" heading followed by one row per monster showing at least the monster name and its HP/AC).

#### Scenario: Linked encounter with monsters

- **Given** a campaign with a linked encounter "Goblin Ambush" containing 3 monsters
- **When** the DM navigates to `/campaigns/[id]/encounters`
- **Then** the "Goblin Ambush" card shows a "Monsters (3)" heading and one row per monster, each row showing the monster's name and HP/AC values

#### Scenario: Linked encounter with no monsters

- **Given** a campaign with a linked encounter "Empty Room" whose `monsters` array is empty
- **When** the DM navigates to `/campaigns/[id]/encounters`
- **Then** the "Empty Room" card shows a "Monsters (0)" heading and no monster rows, and no error is shown

---

### Requirement: ADDED DM edits a linked encounter inline from the campaign encounters page

The system SHALL provide an "Edit" action per linked-encounter card, visible only to the campaign DM, that opens `EncounterEditor` inline for that encounter (`isNew={false}`). On save the system SHALL call `PUT /api/encounters/[id]` with the edited `name`, `description`, and `monsters`; on success it SHALL close the editor and refetch the linked-encounters list via `GET /api/campaigns/[id]/encounters`; on failure it SHALL display the server error message in the page error banner and leave the editor open.

#### Scenario: DM edits a linked encounter and saves

- **Given** the DM is viewing `/campaigns/[id]/encounters` with a linked encounter "Goblin Ambush"
- **When** the DM clicks "Edit" on that card, changes the name to "Goblin Ambush (Hard)", and saves
- **Then** `PUT /api/encounters/e1` is called with the updated name
- **And** on success the inline editor closes, `GET /api/campaigns/[id]/encounters` is called again, and the card now shows "Goblin Ambush (Hard)"

#### Scenario: Edit save fails

- **Given** the DM has the inline editor open for a linked encounter and `PUT /api/encounters/e1` will return a non-2xx response with `{ "error": "Encounter name is required" }`
- **When** the DM saves
- **Then** the page error banner shows "Encounter name is required", the inline editor remains open, and the linked-encounters list is not refetched

#### Scenario: Only one encounter editor is open at a time

- **Given** the DM has the inline editor open for linked encounter "Goblin Ambush"
- **When** the DM clicks "Edit" on a different linked encounter "Dragon's Lair"
- **Then** the editor for "Goblin Ambush" closes and the editor for "Dragon's Lair" opens, so at most one inline `EncounterEditor` is mounted

#### Scenario: Edit is hidden for a non-DM member

- **Given** an active non-DM member of the campaign is viewing `/campaigns/[id]/encounters`
- **When** the linked-encounters list renders
- **Then** no "Edit" control is present on any linked-encounter card

---

### Requirement: ADDED Campaign encounters page renders read-only for non-DM members

The system SHALL determine the current user's campaign role on `app/campaigns/[id]/encounters/page.tsx` (via `useIsDM(campaignId)` or an equivalent that resolves the caller's active role). While the role is still resolving, the page SHALL render the linked-encounters list without any management controls. Once resolved, the "Link Existing Encounter", "Create New Encounter", "Edit", and "Unlink" controls SHALL be rendered only when the current user is an active DM of the campaign; a non-DM member SHALL see the linked-encounters list (name, description, monster roster) with no management controls and no error.

#### Scenario: Non-DM member sees a read-only list

- **Given** an active player (non-DM) member of a campaign with two linked encounters
- **When** the member navigates to `/campaigns/[id]/encounters`
- **Then** both encounters render with name, description, and monster roster
- **And** no "Link Existing Encounter", "Create New Encounter", "Edit", or "Unlink" control is present
- **And** no error banner is shown

#### Scenario: DM sees full management controls

- **Given** the active DM of a campaign with linked encounters
- **When** the DM navigates to `/campaigns/[id]/encounters`
- **Then** the "Link Existing Encounter" and "Create New Encounter" actions are present, and each linked-encounter card shows both an "Edit" and an "Unlink" control

#### Scenario: Controls are hidden until role resolves

- **Given** the current user's campaign role has not yet resolved
- **When** `/campaigns/[id]/encounters` renders the linked-encounters list
- **Then** no management controls are shown, so no control appears and then disappears once the role resolves

---

### Requirement: ADDED Campaign encounters page offers no encounter-deletion action

The system SHALL NOT render any control on `app/campaigns/[id]/encounters/page.tsx` that calls `DELETE /api/encounters/[id]` (destroy the encounter). The only removal action for a linked encounter SHALL be "Unlink", which removes the campaign association only.

#### Scenario: No delete control on the campaign screen

- **Given** the DM is viewing `/campaigns/[id]/encounters` with linked encounters
- **When** each linked-encounter card renders
- **Then** the card exposes "Edit" and "Unlink" but no "Delete" control, and no request to `DELETE /api/encounters/[id]` can be initiated from this page

## MODIFIED Requirements

### Requirement: MODIFIED Campaign encounters page lists only the current campaign's linked encounters

The system SHALL provide `app/campaigns/[id]/encounters/page.tsx`, which on load calls `GET /api/campaigns/[id]/encounters` and renders exactly the returned encounters, with no client-side filtering by campaign (the API already scopes the result). Each rendered card SHALL present the encounter's name, its description when present, and its monster roster, matching the presentation of the global `/encounters` list. The page SHALL be reachable by any active campaign member; management controls are governed by the "Campaign encounters page renders read-only for non-DM members" requirement.

#### Scenario: Campaign with linked encounters

- **Given** a campaign with two linked encounters, "Goblin Ambush" and "Dragon's Lair"
- **When** the DM navigates to `/campaigns/[id]/encounters`
- **Then** both encounters render in the linked-encounters list with name, description, and monster roster, and no other encounter the DM owns is shown

#### Scenario: Campaign with zero linked encounters

- **Given** a campaign with `encounterIds: []`
- **When** the DM navigates to `/campaigns/[id]/encounters`
- **Then** an empty-state message renders, offering "Link Existing Encounter" and "Create New Encounter" actions, and no error is shown

#### Scenario: Non-DM member opens a campaign with linked encounters

- **Given** an active player (non-DM) member of a campaign with two linked encounters
- **When** the member navigates to `/campaigns/[id]/encounters`
- **Then** both encounters render with name, description, and monster roster, and no error is shown

## REMOVED Requirements

None.

## Traceability

- Proposal element "Show monster roster on campaign encounter cards" -> Requirement: ADDED Linked-encounter cards show the encounter's monster roster
- Proposal element "Inline Edit on campaign encounter cards" -> Requirement: ADDED DM edits a linked encounter inline from the campaign encounters page
- Proposal element "Page is DM-aware; non-DM sees read-only list" -> Requirement: ADDED Campaign encounters page renders read-only for non-DM members
- Proposal element "No Delete on campaign screen" -> Requirement: ADDED Campaign encounters page offers no encounter-deletion action
- Proposal element "Campaign list visually matches the global list" -> Requirement: MODIFIED Campaign encounters page lists only the current campaign's linked encounters (card presentation clause)
- Design Decision 1 (`useIsDM` gating) -> Requirement: ADDED Campaign encounters page renders read-only for non-DM members
- Design Decision 2 (`EncounterEditor` + `PUT /api/encounters/:id`) -> Requirement: ADDED DM edits a linked encounter inline from the campaign encounters page
- Design Decision 3 (shared `EncounterCard`) -> Requirement: ADDED Linked-encounter cards show the encounter's monster roster; Requirement: MODIFIED Campaign encounters page lists only the current campaign's linked encounters
- Design Decision 4 (DM-only gating, co-DM edge case) -> Requirement: ADDED Campaign encounters page renders read-only for non-DM members; Requirement: ADDED DM edits a linked encounter inline (failure scenario)
- Requirement: ADDED Linked-encounter cards show the encounter's monster roster -> Tasks: "Extract/share EncounterCard", "Render roster on campaign cards", component tests
- Requirement: ADDED DM edits a linked encounter inline -> Tasks: "Add editingEncounter state + handleEditSave", "Wire Edit button", component + integration tests
- Requirement: ADDED Campaign encounters page renders read-only for non-DM members -> Tasks: "Consume useIsDM and gate management UI", component tests
- Requirement: ADDED Campaign encounters page offers no encounter-deletion action -> Tasks: "Campaign card omits onDelete", component test
- Requirement: MODIFIED Campaign encounters page lists only the current campaign's linked encounters -> Tasks: "Extract/share EncounterCard", "Non-DM read-only path", component tests

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: At most one extra membership request per visit

- **Given** a user opens `/campaigns/[id]/encounters`
- **When** the page resolves the current user's campaign role
- **Then** it issues at most one additional request to the lightweight current-member endpoint (`GET /api/campaigns/[id]/members/me`), not a full roster fetch

### Requirement: Security

- Access control for editing a linked encounter is enforced server-side by `PUT /api/encounters/[id]` (ownership check). Client-side DM gating is convenience only. See functional scenarios: "Edit save fails" and "Edit is hidden for a non-DM member".
- Link/unlink remain DM-only server-side (unchanged). See functional scenario: "DM sees full management controls" and the existing "Unlink" requirement.

#### Scenario: Non-owner edit attempt is rejected by the server

- **Given** a request to `PUT /api/encounters/e1` from a user who does not own encounter `e1`
- **When** the server handles the request
- **Then** it responds `404` and does not modify the encounter, and the client surfaces the error rather than showing a successful edit

### Requirement: Reliability

#### Scenario: List stays consistent after a failed edit

- **Given** the DM's edit save fails with a network error
- **When** the failure is handled
- **Then** the page shows an error, does not refetch, and the previously loaded linked-encounters list remains displayed unchanged (no partial or optimistic update is applied)
