## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED GET /api/campaigns/[id]/encounters resolves linked encounters for any active member

The system SHALL provide `GET /api/campaigns/[id]/encounters`, which resolves `campaign.encounterIds` to the full `Encounter[]` documents, and SHALL allow any campaign member with `status: 'active'` (role `'dm'` or `'player'`) to call it successfully.

#### Scenario: DM fetches linked encounters

- **Given** a campaign owned by DM `alice` with `encounterIds: ["e1", "e2"]`, and `alice` owns encounters `e1` and `e2`
- **When** `alice` calls `GET /api/campaigns/[id]/encounters`
- **Then** the response is `200` with a JSON array containing exactly the full `Encounter` documents for `e1` and `e2`

#### Scenario: Player member fetches the same linked encounters

- **Given** the same campaign, with `bob` as an active `'player'` member
- **When** `bob` calls `GET /api/campaigns/[id]/encounters`
- **Then** the response is `200` with the same two `Encounter` documents `alice` would see (not filtered by `bob`'s own `userId`)

#### Scenario: Non-member is rejected

- **Given** a campaign with no membership record for `carol`
- **When** `carol` calls `GET /api/campaigns/[id]/encounters`
- **Then** the response is `404`

#### Scenario: Empty encounterIds returns empty list

- **Given** a campaign with `encounterIds: []`
- **When** an active member calls `GET /api/campaigns/[id]/encounters`
- **Then** the response is `200` with an empty JSON array, and no query is issued against the encounters collection with an empty `$in`

---

### Requirement: ADDED POST /api/campaigns/[id]/encounters links an existing encounter, DM only

The system SHALL provide `POST /api/campaigns/[id]/encounters` accepting body `{ encounterId: string }`, which adds `encounterId` to `campaign.encounterIds` via `$addToSet` after verifying both that the requester is the campaign's active DM and that the encounter belongs to the requester.

#### Scenario: DM links an owned encounter

- **Given** DM `alice` owns encounter `e3` and her campaign has `encounterIds: ["e1"]`
- **When** `alice` calls `POST /api/campaigns/[id]/encounters` with `{ encounterId: "e3" }`
- **Then** the response is `200` or `201`, and the campaign's `encounterIds` becomes `["e1", "e3"]`

#### Scenario: Linking the same encounter twice is idempotent

- **Given** the campaign's `encounterIds` already contains `"e3"`
- **When** `alice` calls `POST /api/campaigns/[id]/encounters` with `{ encounterId: "e3" }` again
- **Then** the response is a success status and `encounterIds` still contains `"e3"` exactly once

#### Scenario: Linking an encounter you don't own is rejected

- **Given** encounter `e9` is owned by a different user, not `alice`
- **When** `alice` calls `POST /api/campaigns/[id]/encounters` with `{ encounterId: "e9" }`
- **Then** the response is `404`, and the campaign's `encounterIds` is unchanged

#### Scenario: Player member cannot link

- **Given** `bob` is an active `'player'` member of `alice`'s campaign
- **When** `bob` calls `POST /api/campaigns/[id]/encounters` with any `encounterId`
- **Then** the response is `404`, and the campaign's `encounterIds` is unchanged

---

### Requirement: ADDED DELETE /api/campaigns/[id]/encounters/[encounterId] unlinks without deleting the encounter, DM only

The system SHALL provide `DELETE /api/campaigns/[id]/encounters/[encounterId]`, which removes `encounterId` from `campaign.encounterIds` via `$pull` when the requester is the campaign's active DM, and SHALL NOT delete the underlying `Encounter` document under any circumstance.

#### Scenario: DM unlinks a linked encounter

- **Given** DM `alice`'s campaign has `encounterIds: ["e1", "e3"]`
- **When** `alice` calls `DELETE /api/campaigns/[id]/encounters/e3`
- **Then** the response is `200`, the campaign's `encounterIds` becomes `["e1"]`, and `GET /api/encounters/e3` still returns the encounter document

#### Scenario: Unlinking an encounter that isn't linked is a no-op success

- **Given** the campaign's `encounterIds` does not contain `"e7"`
- **When** `alice` calls `DELETE /api/campaigns/[id]/encounters/e7`
- **Then** the response is `200`, and the campaign's `encounterIds` is unchanged

#### Scenario: Player member cannot unlink

- **Given** `bob` is an active `'player'` member of `alice`'s campaign, which has `encounterIds: ["e1"]`
- **When** `bob` calls `DELETE /api/campaigns/[id]/encounters/e1`
- **Then** the response is `404`, and the campaign's `encounterIds` is unchanged

---

### Requirement: MODIFIED POST /api/encounters accepts optional campaignId to create and link in one request

The system SHALL extend `POST /api/encounters` to accept an optional `campaignId` field in the request body. When present, the system SHALL verify the requester is that campaign's active DM before creating the encounter; on success it SHALL create the encounter and then link it to the campaign (`$addToSet`), and if the link step fails after the encounter was created, it SHALL return the created encounter with a non-fatal warning rather than deleting it or returning a full failure.

#### Scenario: Create and link succeeds

- **Given** `alice` is the active DM of campaign `c1`
- **When** `alice` calls `POST /api/encounters` with `{ name: "Goblin Ambush", campaignId: "c1" }`
- **Then** the response is `201` with the created `Encounter`, and campaign `c1`'s `encounterIds` now includes the new encounter's `id`

#### Scenario: campaignId omitted behaves exactly as before

- **Given** the existing unmodified behavior of `POST /api/encounters`
- **When** a request is made with no `campaignId` field
- **Then** the encounter is created and owned by the requester, and no campaign is modified

#### Scenario: Requester is not the campaign's DM

- **Given** `bob` is an active `'player'` member of campaign `c1` (DM is `alice`)
- **When** `bob` calls `POST /api/encounters` with `{ name: "Trap Room", campaignId: "c1" }`
- **Then** the response is `404`, and no `Encounter` document is created

#### Scenario: Encounter creation succeeds but linking fails

- **Given** `alice` is the active DM of campaign `c1`, and the subsequent link (`$addToSet`) call throws
- **When** `alice` calls `POST /api/encounters` with `{ name: "Owlbear Den", campaignId: "c1" }`
- **Then** the response is `201` with the created `Encounter` and a `linkWarning` field describing the failure, the encounter is persisted and independently retrievable via `GET /api/encounters`, and campaign `c1`'s `encounterIds` does not include it

## Traceability

- Proposal element: `GET /api/campaigns/[id]/encounters` readable by any active member -> Requirement: "ADDED GET /api/campaigns/[id]/encounters resolves linked encounters for any active member"
- Proposal element: `POST`/`DELETE` link routes restricted to DM -> Requirement: "ADDED POST /api/campaigns/[id]/encounters links an existing encounter, DM only", "ADDED DELETE /api/campaigns/[id]/encounters/[encounterId] unlinks without deleting the encounter, DM only"
- Proposal element: `POST /api/encounters` + `campaignId` convenience, orphan-on-link-failure -> Requirement: "MODIFIED POST /api/encounters accepts optional campaignId to create and link in one request"
- Design decision: Decision 1 (authorization split) -> Requirement: all four requirements above (role gating in every scenario)
- Design decision: Decision 3 (ownership check on link) -> Requirement: "ADDED POST /api/campaigns/[id]/encounters..." scenario "Linking an encounter you don't own is rejected"
- Design decision: Decision 4 (no rollback) -> Requirement: "MODIFIED POST /api/encounters..." scenario "Encounter creation succeeds but linking fails"
- Design decision: Decision 5 (404-only) -> all rejection scenarios across all four requirements
- Design decision: Decision 6 (idempotent unlink) -> Requirement: "ADDED DELETE..." scenario "Unlinking an encounter that isn't linked is a no-op success"
- Requirement -> Task(s): see `tasks.md` (route implementation, storage methods, tests per requirement)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Resolving linked encounters is a single query

- **Given** a campaign with 20 linked encounter ids
- **When** `GET /api/campaigns/[id]/encounters` is called
- **Then** exactly one `find()` call is issued against the `encounters` collection (using `id: { $in: encounterIds }`), not one query per id

### Requirement: Security

See functional scenarios: "Non-member is rejected", "Player member cannot link", "Player member cannot unlink", "Linking an encounter you don't own is rejected", "Requester is not the campaign's DM". All access-control rejections across every new/modified route return `404`, never `403`, per Design Decision 5.

### Requirement: Reliability

#### Scenario: Partial failure in create+link never loses the created encounter

- **Given** the create+link flow in `POST /api/encounters` where encounter creation succeeds and the link call fails
- **When** the response is returned to the caller
- **Then** the created `Encounter` document is durably persisted and retrievable via `GET /api/encounters` even though the campaign link did not complete
