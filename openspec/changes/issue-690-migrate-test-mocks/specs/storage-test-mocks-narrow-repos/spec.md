## ADDED Requirements

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

## Traceability

- Proposal element -> Requirement: route import swaps -> Route handlers use narrow storage repos
- Proposal element -> Requirement: test re-mocking -> Unit tests mock narrow repos
- Design decision -> Requirement: Decision 1 -> Route handlers; Decisions 2, 3 -> Unit tests
- Requirement -> Task(s): Route handlers -> Tasks 1.x–4.x (route steps); Unit tests -> Tasks 1.x–4.x (test steps)

## Non-Functional Acceptance Criteria

> Scenarios here do not duplicate the functional scenarios above.

### Requirement: Operability

#### Scenario: Test suite isolation

- **Given** `npm run test:unit` runs after each batch
- **When** the migrated route tests execute
- **Then** none reach the real database because of an incorrect mock path
