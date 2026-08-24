## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Campaign encounters page lists only the current campaign's linked encounters

The system SHALL provide `app/campaigns/[id]/encounters/page.tsx`, which on load calls `GET /api/campaigns/[id]/encounters` and renders exactly the returned encounters, with no client-side filtering by campaign (the API already scopes the result).

#### Scenario: Campaign with linked encounters

- **Given** a campaign with two linked encounters, "Goblin Ambush" and "Dragon's Lair"
- **When** the DM navigates to `/campaigns/[id]/encounters`
- **Then** both encounters render in the linked-encounters list, and no other encounter the DM owns is shown

#### Scenario: Campaign with zero linked encounters

- **Given** a campaign with `encounterIds: []`
- **When** the DM navigates to `/campaigns/[id]/encounters`
- **Then** an empty-state message renders, offering "Link Existing Encounter" and "Create New Encounter" actions, and no error is shown

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

## MODIFIED Requirements

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

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Picker fetch happens once per open, not per keystroke

- **Given** the DM opens the "Link Existing Encounter" picker
- **When** the DM types multiple characters into the search input
- **Then** `GET /api/encounters` is called exactly once (on open), and subsequent filtering by search text happens client-side without additional network requests

### Requirement: Security

See functional scenario: "Linking an encounter the DM no longer owns fails visibly". No client-side authorization logic is introduced by this change; all role/ownership enforcement is delegated to the existing API (already covered by `openspec/specs/campaign-encounter-linking/spec.md`).

### Requirement: Reliability

See functional scenario: "Encounter created but linking failed (linkWarning)" for the client-side treatment of the API's already-specified partial-failure behavior. No new reliability property is introduced beyond consuming that existing contract visibly.
