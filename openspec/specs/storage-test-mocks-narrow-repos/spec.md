# storage-test-mocks-narrow-repos Specification

## Purpose
TBD - created by archiving change issue-690-migrate-test-mocks. Update Purpose after archive.

## Requirements

### Requirement: ADDED Route handlers use narrow storage repos

The system SHALL import narrow repo modules directly in the route handlers listed in `proposal.md` instead of the `storage` facade from `@/lib/storage`.

#### Scenario: Route calls its repo directly

- **Given** an API request to any migrated route (e.g. `GET /api/conditions/catalog`)
- **When** the handler runs
- **Then** the data access is performed through the corresponding repo (e.g. `conditionCatalogRepo.loadConditionCatalog`)
- **And** the response is identical to the previous implementation

#### Scenario: No facade imports remain in app code

- **Given** all four batches are merged
- **When** `app/` is searched for imports of `@/lib/storage`
- **Then** no file imports the `storage` facade

### Requirement: ADDED Unit tests mock narrow repos

Unit tests for the migrated routes SHALL mock the specific repo modules they depend on rather than the `storage` facade.

#### Scenario: Test mocks target repo modules

- **Given** a migrated route's unit test
- **When** it is inspected
- **Then** it uses `jest.mock('@/lib/storage/<repo>')` and does not `jest.mock('@/lib/storage')`
- **And** all of its pre-existing assertions pass without weakening
