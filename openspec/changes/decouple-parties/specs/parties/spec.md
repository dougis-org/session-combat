## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Campaign hosts Parties

The system SHALL allow a Campaign to track multiple participating parties through a `partyIds` reference array.

#### Scenario: Campaign tracks its parties

- **Given** an existing Campaign and an existing Party
- **When** the Party is added to the Campaign
- **Then** the Campaign's `partyIds` array contains the Party's ID, and the Party document itself is not modified with a `campaignId`

#### Scenario: Lazy Migration of Legacy Parties

- **Given** a Campaign with no `partyIds` initialized, and legacy Party documents containing this Campaign's `id` in their `campaignId` field
- **When** the Campaign's parties are requested via `loadPartiesByCampaign`
- **Then** the system falls back to querying the legacy `campaignId` field on the Party documents and returns those parties

## MODIFIED Requirements

### Requirement: MODIFIED Campaign deletion isolation

The system SHALL NOT delete Party documents when their hosting Campaign is deleted.

#### Scenario: Deleting a Campaign preserves its Parties

- **Given** a Campaign with one or more Parties participating
- **When** the Campaign is deleted by the DM
- **Then** the Campaign document and related session logs are deleted, but the Party documents remain in the database intact

## REMOVED Requirements

### Requirement: REMOVED Party exclusively belongs to a Campaign

Reason for removal: Parties need to be persistent, reusable across campaigns, and exist independently in the user's library. The `campaignId` property on Party documents is deprecated.

## Traceability

- Proposal element -> Requirement: "Updating `storage.deleteCampaign` to stop deleting parties" -> MODIFIED Campaign deletion isolation
- Design decision -> Requirement: Decision 2: Lazy Data Migration -> ADDED Campaign hosts Parties (Scenario: Lazy Migration)
- Requirement -> Task(s): MODIFIED Campaign deletion isolation -> Task to update `storage.deleteCampaign()` (will be in tasks.md)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Load parties by campaign latency

- **Given** a Campaign with 5 associated parties
- **When** `loadPartiesByCampaign` is called
- **Then** the parties are fetched using a single query (e.g., `$in` on `_id` or `id`) with no N+1 query penalty

### Requirement: Security

> If access-control rejections are already fully specified by functional scenarios above, replace the scenario below with a cross-reference: "See functional scenarios: [scenario name(s)]". Only add a distinct scenario here if there is a security property not expressed by the functional requirements (e.g., audit log written, token not leaked in error body).

#### Scenario: Access control

See functional scenarios: No net new access control rules are introduced; parties remain scoped to their owner's `userId`.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a failure to load parties due to a malformed `partyIds` array
- **When** loading the campaign data
- **Then** the system safely ignores invalid IDs and returns the valid parties without crashing
