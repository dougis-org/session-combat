## Context

- Relevant architecture: The API layer handles copying `CampaignTemplate` into `Campaign` via `app/api/campaigns/global/[id]/copy/route.ts`. The storage layer manages the database through `lib/storage.ts` and `lib/storage/encounterRepo.ts`.
- Dependencies: None added. Uses existing MongoDB driver and UUID library.
- Interfaces/contracts touched: 
  - `CampaignTemplate` in `lib/types.ts` gets a new `encounters` array.
  - `EncounterTemplate` type added to `lib/types.ts`.

## Goals / Non-Goals

### Goals

- Allow `CampaignTemplate` definitions to embed a list of default encounters.
- When a user copies a `CampaignTemplate`, automatically generate standalone `Encounter` records for the user.
- Associate the newly generated `Encounter` IDs with the newly created `Campaign`.
- Roll back the entire campaign creation transaction if encounter generation fails.

### Non-Goals

- Migrating existing campaigns that have already been created from templates.
- Building a UI for editing `CampaignTemplate` encounters (this is for seeded/developer-driven templates for now).
- Supporting standalone "Global Encounters".

## Decisions

### Decision 1: Embedded Encounter Templates

- Chosen: Define `EncounterTemplate` (an `Omit` or subset of `Encounter`) and add `encounters?: EncounterTemplate[]` directly to `CampaignTemplate`.
- Alternatives considered: Global standalone encounters that the template references by ID.
- Rationale: The encounters in a campaign template are highly specific to that campaign module (e.g., "Goblin Ambush on the Triboar Trail"). Embedding them directly in the template avoids managing dangling global encounter records and simplifies seeding scripts.
- Trade-offs: Reusing an encounter across multiple completely different campaign templates requires duplicating the data in the seeder, but this is an acceptable and rare case.

### Decision 2: API Route Iteration

- Chosen: During `app/api/campaigns/global/[id]/copy/route.ts`, iterate over `template.encounters`, call `storage.saveEncounter()` for each, and store the resulting IDs.
- Alternatives considered: Adding a bulk-insert method to `encounterRepo.ts`.
- Rationale: Since the number of default encounters per campaign is small (typically < 20) and we already use single-insert patterns during this copy route, standard looping over `saveEncounter` is sufficient and avoids writing new DB-layer code.
- Trade-offs: Multiple network round trips to the database instead of one `insertMany`, though they happen locally in the same server context.

## Proposal to Design Mapping

- Proposal element: Update `CampaignTemplate` type
  - Design decision: Decision 1 (Embedded Encounter Templates)
  - Validation approach: Type-checking via TypeScript compilation and unit tests for type compliance.
- Proposal element: Generate real objects upon copy
  - Design decision: Decision 2 (API Route Iteration)
  - Validation approach: Integration tests on the copy route ensuring `Encounter` records exist in the DB after a successful request.

## Functional Requirements Mapping

- Requirement: A copied campaign must contain IDs for all encounters specified in the template.
  - Design element: The map/reduce step in the copy route that transforms `EncounterTemplate` to `Encounter` and captures their IDs.
  - Acceptance criteria reference: Will be defined in specs.
  - Testability notes: Can be verified by hitting the copy API and then querying the GET campaign API to check `encounterIds`.

- Requirement: Failure to save an encounter rolls back campaign creation.
  - Design element: `try/catch` block wrapping the encounter creation logic that triggers `storage.deleteCampaign` on error.
  - Acceptance criteria reference: Will be defined in specs.
  - Testability notes: Mock the storage layer to throw an error on encounter save, verify the campaign is not persisted.

## Non-Functional Requirements Mapping

- Requirement category: Reliability
  - Requirement: Campaign copy transaction is atomic (all or nothing).
  - Design element: Enhanced rollback logic in the route handler.
  - Acceptance criteria reference: Will be defined in specs.
  - Testability notes: Inject errors into the mock DB during the copy phase.

## Risks / Trade-offs

- Risk/trade-off: Rollbacks on MongoDB without replica sets are manual.
  - Impact: If the manual rollback (e.g., `deleteCampaign`) fails, data is orphaned.
  - Mitigation: Log the error robustly. Because we are inserting independent `Encounter` objects, orphaned encounters are harmless (just take up a tiny bit of space), but an orphaned `Campaign` is worse. The sequence will be: generate ID, save campaign, loop and save encounters. If encounters fail, we delete the campaign and any already-saved encounters.

## Rollback / Mitigation

- Rollback trigger: Production errors tracing back to `CampaignTemplate` copying failures.
- Rollback steps: Revert the PR. No DB migration down is strictly necessary because missing `encounters` on templates won't break the updated code (it uses optional chaining or handles `undefined`).
- Data migration considerations: No backward migration needed.
- Verification after rollback: Test that copying a campaign succeeds and just skips encounters.

## Operational Blocking Policy

- If CI checks fail: Resolve before merging. Do not merge with failing type checks or tests.
- If security checks fail: Block the release.
- If required reviews are blocked/stale: Ping reviewers after 24 hours. Code owner approval is required.
- Escalation path and timeout: N/A (Standard project flow).

## Open Questions

- None at this time.
