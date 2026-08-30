# campaign-encounter-management-ui Specification

## Purpose

Defines the campaign-scoped encounters management screen (`app/campaigns/[id]/encounters/page.tsx`): how a campaign DM lists, links, creates, edits, and unlinks the encounters attached to a campaign, and how the screen renders for non-DM members. Related history: [`2026-08-24-campaign-encounters-management-screen`](../../changes/archive/2026-08-24-campaign-encounters-management-screen/design.md) and [`2026-08-30-campaign-encounter-edit-parity`](../../changes/archive/2026-08-30-campaign-encounter-edit-parity/design.md).

## Requirements

### Requirement: ADDED Campaign encounters page lists only the current campaign's linked encounters

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

---

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

---

### Requirement: ADDED "Link Existing Encounter" picker filters client-side and excludes already-linked encounters

The system SHALL provide a picker, opened from the encounters page, that fetches all of the DM's owned encounters via `GET /api/encounters`, excludes (client-side, by `id`) any encounter already present in the campaign's linked list, and further filters by a case-insensitive substring match against encounter name as the DM types into a search input.

#### Scenario: Picker excludes already-linked encounters

- **Given** the DM owns encounters `e1`, `e2`, `e3`, and the campaign already has `e1` linked
- **When** the DM opens the "Link Existing Encounter" picker
- **Then** only `e2` and `e3` appear as selectable options

#### Scenario: Picker search filters by name

- **Given** the picker is open showing unlinked encounters "Goblin Ambush" and "Owlbear Den"
- **When** the DM types "gob" into the search input
- **Then** only "Goblin Ambush" remains visible in the picker

#### Scenario: All owned encounters are already linked

- **Given** the DM's every owned encounter is already linked to this campaign
- **When** the DM opens the "Link Existing Encounter" picker
- **Then** a message states all owned encounters are already linked, and no selectable rows render

#### Scenario: DM links an encounter from the picker

- **Given** the picker shows an unlinked encounter "Owlbear Den"
- **When** the DM selects it and confirms linking
- **Then** `POST /api/campaigns/[id]/encounters` is called with `{ encounterId }`, and on success the linked-encounters list is refetched and "Owlbear Den" appears in it

#### Scenario: Linking an encounter the DM no longer owns fails visibly

- **Given** the link `POST` call returns `404`
- **When** the DM attempts to link that encounter
- **Then** an inline error is shown, the linked-encounters list is not refetched, and the picker remains open with the encounter still selectable (not silently removed)

---

### Requirement: ADDED "Create New Encounter" reuses EncounterEditor and links the result to the campaign

The system SHALL render the existing `EncounterEditor` component unmodified when "Create New Encounter" is active, and on save SHALL call `POST /api/encounters` with `campaignId` set to the current campaign's id, without adding a `campaignId` prop or any other new prop to `EncounterEditor` itself.

#### Scenario: Create and link succeeds

- **Given** the DM opens "Create New Encounter" and fills in a name
- **When** the DM saves
- **Then** `POST /api/encounters` is called with the encounter fields plus `campaignId`, the create panel closes, and the linked-encounters list is refetched and includes the new encounter

#### Scenario: Encounter created but linking failed (linkWarning)

- **Given** `POST /api/encounters` returns `201` with the created encounter and a `linkWarning` field
- **When** the save completes
- **Then** a non-blocking warning is shown stating the encounter was created but not linked, the create panel still closes, and the linked-encounters list is refetched (the new encounter will not yet appear in it, since the link did not complete)

---

### Requirement: ADDED "Unlink" removes the campaign association without deleting the encounter

The system SHALL provide an "Unlink" action per linked-encounter row that, after an explicit confirmation naming the encounter and stating it will not be deleted, calls `DELETE /api/campaigns/[id]/encounters/[encounterId]` and refetches the linked-encounters list on success.

#### Scenario: DM confirms and unlinks

- **Given** a linked encounter "Goblin Ambush" is shown in the list
- **When** the DM clicks "Unlink" and confirms the dialog
- **Then** `DELETE /api/campaigns/[id]/encounters/e1` is called, and on success the linked-encounters list is refetched and no longer includes "Goblin Ambush"

#### Scenario: DM cancels the confirmation

- **Given** the DM clicks "Unlink" on a linked encounter
- **When** the DM dismisses/cancels the confirmation dialog
- **Then** no `DELETE` request is made, and the encounter remains in the linked list unchanged

#### Scenario: Confirmation copy states the encounter is not deleted

- **Given** the DM clicks "Unlink" on any linked encounter
- **When** the confirmation dialog renders
- **Then** its text explicitly states the encounter will not be deleted and remains available in the global Encounters list

---

### Requirement: ADDED In-flight mutation buttons are disabled to prevent duplicate submissions

The system SHALL disable the relevant action control (link button, unlink button, or `EncounterEditor`'s save button) for the duration of its in-flight request, and SHALL NOT issue a second identical request while one is pending.

#### Scenario: Double-click on link does not double-submit

- **Given** the DM has selected an encounter to link and the link request is in flight
- **When** the DM clicks the link button again before the first request resolves
- **Then** only one `POST /api/campaigns/[id]/encounters` call is made


### Requirement: MODIFIED Campaign layout nav includes Encounters and Combat tabs

The system SHALL extend the nav array in `app/campaigns/[id]/layout.tsx` to include, in addition to the existing Members/Sessions/Prompts/Library tabs, an "Encounters" tab linking to `/campaigns/[id]/encounters` and a "Combat" tab linking to `/campaigns/[id]/combat`.

#### Scenario: Both new tabs render and link correctly

- **Given** a DM viewing any page under `/campaigns/[id]/*`
- **When** the campaign layout nav renders
- **Then** it includes an "Encounters" link to `/campaigns/[id]/encounters` and a "Combat" link to `/campaigns/[id]/combat`, alongside the four pre-existing tabs

#### Scenario: Active tab highlighting works for the new routes

- **Given** the DM is currently on `/campaigns/[id]/encounters`
- **When** the nav renders
- **Then** the "Encounters" tab is marked active (`aria-current="page"`), consistent with existing tab active-state behavior

### Requirement: Non-functional acceptance criteria

The campaign encounters management screen SHALL satisfy the following performance, security, and reliability criteria, each expressed as one or more scenarios below.


**Performance**

#### Scenario: Picker fetch happens once per open, not per keystroke

- **Given** the DM opens the "Link Existing Encounter" picker
- **When** the DM types multiple characters into the search input
- **Then** `GET /api/encounters` is called exactly once (on open), and subsequent filtering by search text happens client-side without additional network requests

#### Scenario: At most one extra membership request per visit

- **Given** a user opens `/campaigns/[id]/encounters`
- **When** the page resolves the current user's campaign role
- **Then** it issues at most one additional request to the lightweight current-member endpoint (`GET /api/campaigns/[id]/members/me`), not a full roster fetch

**Security**

See functional scenario: "Linking an encounter the DM no longer owns fails visibly". No client-side authorization logic is introduced by this change; all role/ownership enforcement is delegated to the existing API (already covered by `openspec/specs/campaign-encounter-linking/spec.md`).

Access control for editing a linked encounter is enforced server-side by `PUT /api/encounters/[id]` (ownership check). Client-side DM gating is convenience only. Link/unlink remain DM-only server-side (unchanged).

#### Scenario: Non-owner edit attempt is rejected by the server

- **Given** a request to `PUT /api/encounters/e1` from a user who does not own encounter `e1`
- **When** the server handles the request
- **Then** it responds `404` and does not modify the encounter, and the client surfaces the error rather than showing a successful edit

**Reliability**

See functional scenario: "Encounter created but linking failed (linkWarning)" for the client-side treatment of the API's already-specified partial-failure behavior. No new reliability property is introduced beyond consuming that existing contract visibly.

#### Scenario: List stays consistent after a failed edit

- **Given** the DM's edit save fails with a network error
- **When** the failure is handled
- **Then** the page shows an error, does not refetch, and the previously loaded linked-encounters list remains displayed unchanged (no partial or optimistic update is applied)

## Traceability

- Proposal element: linked-encounters list -> Requirement: "ADDED Campaign encounters page lists only the current campaign's linked encounters"
- Proposal element: "Link Existing Encounter" picker (client-side filter) -> Requirement: "ADDED \"Link Existing Encounter\" picker filters client-side and excludes already-linked encounters"
- Proposal element: "Create New Encounter" via EncounterEditor, auto-link -> Requirement: "ADDED \"Create New Encounter\" reuses EncounterEditor and links the result to the campaign"
- Proposal element: "Unlink" with confirmation, no delete -> Requirement: "ADDED \"Unlink\" removes the campaign association without deleting the encounter"
- Proposal element: nav tabs reachable (folded-in #540 scope) -> Requirement: "MODIFIED Campaign layout nav includes Encounters and Combat tabs"
- Design decision: Decision 2 (refetch after mutation) -> all ADDED requirements above (refetch specified in every success scenario)
- Design decision: Decision 3 (client-side picker filter) -> Requirement: "ADDED \"Link Existing Encounter\" picker..."
- Design decision: Decision 4 (EncounterEditor reuse, no prop change) -> Requirement: "ADDED \"Create New Encounter\"..."
- Design decision: Decision 5 (linkWarning handling) -> Requirement: "ADDED \"Create New Encounter\"..." scenario "Encounter created but linking failed (linkWarning)"
- Design decision: Decision 6 (unlink confirm copy) -> Requirement: "ADDED \"Unlink\"..." scenario "Confirmation copy states the encounter is not deleted"
- Design decision: Decision 7 (nav tabs) -> Requirement: "MODIFIED Campaign layout nav includes Encounters and Combat tabs"
- Requirement -> Task(s): see `tasks.md`
