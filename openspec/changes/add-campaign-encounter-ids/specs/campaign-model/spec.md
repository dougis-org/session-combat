## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Campaign encounter links field

The system SHALL accept and normalize an `encounterIds` field on
`Campaign` representing the many-to-many link from a campaign to the
encounters available to it.

#### Scenario: Type declaration accepts encounterIds

- **Given** a `Campaign` object being constructed in application code
- **When** it includes `encounterIds: ['enc-1', 'enc-2']`
- **Then** the object type-checks against the `Campaign` interface in
  `lib/types.ts` with no compiler error

#### Scenario: Load campaign with existing encounterIds preserves the array

- **Given** a campaign document stored in MongoDB with
  `encounterIds: ['enc-1', 'enc-2']`
- **When** `storage.loadCampaignById(id, userId)` or
  `storage.loadCampaigns(userId)` reads that document
- **Then** the returned `Campaign` object's `encounterIds` is exactly
  `['enc-1', 'enc-2']`, unchanged

#### Scenario: Load legacy campaign with no encounterIds field defaults to empty array

- **Given** a campaign document stored in MongoDB that predates this
  change and has no `encounterIds` key at all
- **When** `storage.loadCampaignById(id, userId)` or
  `storage.loadCampaigns(userId)` reads that document
- **Then** the returned `Campaign` object's `encounterIds` is `[]`

#### Scenario: Load campaign with a malformed encounterIds value defaults to empty array

- **Given** a campaign document stored in MongoDB where `encounterIds`
  is present but is not an array (for example `null` or a string)
- **When** `storage.loadCampaignById(id, userId)` or
  `storage.loadCampaigns(userId)` reads that document
- **Then** the returned `Campaign` object's `encounterIds` is `[]`

#### Scenario: Saving a campaign persists encounterIds without a dedicated write path

- **Given** an in-memory `Campaign` object with
  `encounterIds: ['enc-1']`
- **When** `storage.saveCampaign(campaign)` is called
- **Then** the persisted document in the `campaigns` collection includes
  `encounterIds: ['enc-1']`, without any change to `saveCampaign()`
  beyond what already exists (the full object is spread into `$set`)

## Traceability

- Proposal element: "Add `encounterIds?: string[]` to `Campaign` in
  `lib/types.ts`." -> Requirement: ADDED Campaign encounter links field
  (Scenario: Type declaration accepts encounterIds)
- Proposal element: "Default it to `[]` in `normalizeCampaign()` so
  existing campaign docs without the field normalize safely." ->
  Requirement: ADDED Campaign encounter links field (Scenario: Load
  legacy campaign with no encounterIds field defaults to empty array;
  Scenario: Load campaign with a malformed encounterIds value defaults
  to empty array)
- Design decision: Decision 1 (optional field type) -> Requirement:
  ADDED Campaign encounter links field (Scenario: Type declaration
  accepts encounterIds)
- Design decision: Decision 2 (`Array.isArray` default in
  `normalizeCampaign()`) -> Requirement: ADDED Campaign encounter links
  field (all normalization scenarios)
- Requirement: ADDED Campaign encounter links field -> Task(s): see
  `tasks.md` — type update task, normalization update task, unit test
  task

## Non-Functional Acceptance Criteria

> No NFAC scenarios beyond the functional ones above. This change has no
> distinct performance, security, or reliability surface: it adds a
> field and an in-memory default with no new I/O, no new endpoint, and no
> new access-control boundary. The reliability property ("no migration
> needed, legacy docs normalize safely on every read") is already fully
> covered by the functional scenarios "Load legacy campaign with no
> encounterIds field defaults to empty array" and "Load campaign with a
> malformed encounterIds value defaults to empty array" above.
