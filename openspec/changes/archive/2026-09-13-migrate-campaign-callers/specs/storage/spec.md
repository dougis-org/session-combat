## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

*(None - this is a pure refactoring change with no new capabilities added.)*

## MODIFIED Requirements

### Requirement: MODIFIED Storage God Object Callers for Campaign methods

The system SHALL decouple callers from the god-object storage facade by enforcing direct imports of the `campaignRepo` module for campaign data access.

#### Scenario: Verify application paths function correctly with narrow imports

- **Given** an API route or script that requires campaign data (e.g. `/api/campaigns`)
- **When** the application attempts to load, save, or delete campaign data
- **Then** the application succeeds in processing data via the `campaignRepo` methods without error, proving the code paths remain fully functional post-refactoring.

#### Scenario: Verify test suites run with updated isolated campaign mocks

- **Given** the application's test suites
- **When** test suites testing files that utilize Campaign methods are executed
- **Then** the tests pass and no "method not found" or "undefined" errors are thrown, confirming `jest.mock("@/lib/storage/campaignRepo")` correctly stubs out interactions.

## REMOVED Requirements

*(None)*

## Traceability

- Proposal element -> Requirement: Migrate 9 campaign methods -> MODIFIED Storage God Object Callers
- Design decision -> Requirement: Direct File Imports, Mocking Strategy -> MODIFIED Storage God Object Callers
- Requirement -> Task(s): Update API routes, Utils, Scripts, Test Files

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

*(No change from existing baseline)*

### Requirement: Security

*(No change from existing baseline)*

### Requirement: Reliability

*(No change from existing baseline)*

### Requirement: Operability (Code Coupling)

#### Scenario: Decrease code coupling

- **Given** the application source code
- **When** analyzed using search utilities (e.g., `grep`)
- **Then** `storage.loadCampaigns`, `storage.loadCampaignById`, `storage.saveCampaign`, `storage.deleteCampaign`, `storage.setActiveCampaignSession`, `storage.claimActiveCampaignSession`, `storage.loadCampaignByIdAny`, `storage.listCampaignsForMember`, and `storage.getCampaignsByIds` are no longer present in the codebase.
