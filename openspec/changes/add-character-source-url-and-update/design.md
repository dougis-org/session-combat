## Context

- Relevant architecture: The D&D Beyond character import logic located in `lib/server/dndBeyondCharacterImport.ts`, the frontend API layer (`app/api/characters/import/route.ts`), and the base `Character` data model in `lib/types.ts`.
- Dependencies: MongoDB driver for character updates, D&D Beyond API client.
- Interfaces/contracts touched: `Character` interface in `lib/types.ts`, `POST /api/characters/import` response and payload.

## Goals / Non-Goals

### Goals

- Store the provider and source URL of an imported character in the database.
- Allow updating the character by refetching from the stored URL.
- Show a clear warning to users that updating completely replaces their character data.

### Non-Goals

- Merging individual character fields to preserve current HP or inventory.
- Automatic background syncing.

## Decisions

### Decision 1: Data Model Addition

- Chosen: Add an `externalSync?: { provider: 'dndbeyond'; url: string; lastSyncedAt?: Date }` object to the `Character` type in `lib/types.ts`.
- Alternatives considered: Adding just `sourceUrl?: string`.
- Rationale: Using an object prepares the system for future integrations (like Open5e) by explicitly defining the provider, which dictates how the URL should be parsed and fetched.
- Trade-offs: Slightly more complex than a simple string, but much more resilient to future changes.

### Decision 2: Sync API Endpoint

- Chosen: Reuse the existing `POST /api/characters/import` endpoint, but pass the character's stored URL from the frontend along with `overwrite: true`.
- Alternatives considered: Creating a new `POST /api/characters/[id]/sync` endpoint.
- Rationale: The `import` endpoint with `overwrite: true` already preserves the database `_id` and `id`, achieving exactly the "full replace" semantic we want without duplicating logic. The frontend can simply supply the stored URL.
- Trade-offs: The client is trusted to supply the correct URL, though since they could just run an import anyway, this does not present a new security risk.

### Decision 3: UI Warning

- Chosen: A confirmation modal in the Character view when clicking "Sync from D&D Beyond" that requires explicit confirmation before triggering the import.
- Alternatives considered: A simple button with a browser `window.confirm`.
- Rationale: A custom modal is more aligned with the app's design language and allows for a clearer, more descriptive warning about data loss.
- Trade-offs: Requires building/updating a React modal component.

## Proposal to Design Mapping

- Proposal element: Adding `externalSync` to the `Character` type.
  - Design decision: Decision 1 (Data Model Addition).
  - Validation approach: Type-checking and unit tests ensuring the object is saved to the DB correctly.
- Proposal element: Updating or adding an API endpoint to perform a sync.
  - Design decision: Decision 2 (Sync API Endpoint).
  - Validation approach: Integration tests validating that `POST /api/characters/import` correctly saves the new `externalSync` block.
- Proposal element: Adding a sync button and warning modal to the Character view UI.
  - Design decision: Decision 3 (UI Warning).
  - Validation approach: Playwright E2E tests validating the modal appears and correctly triggers the sync.

## Functional Requirements Mapping

- Requirement: Characters imported from D&D Beyond must include the `externalSync` object in their DB record.
  - Design element: Decision 1 & 2.
  - Acceptance criteria reference: specs/import-sync/spec.md
  - Testability notes: Mock the D&D Beyond API and verify the resulting MongoDB record contains the block.
- Requirement: The character list/sheet must display a sync button if `externalSync` is present.
  - Design element: Decision 3.
  - Acceptance criteria reference: specs/import-sync/spec.md
  - Testability notes: Mount the component with mock character data and assert the button's presence.
- Requirement: The sync button must display a warning modal before proceeding.
  - Design element: Decision 3.
  - Acceptance criteria reference: specs/import-sync/spec.md
  - Testability notes: E2E test verifying modal interaction.

## Non-Functional Requirements Mapping

- Requirement category: performance/security/reliability/operability
  - Requirement: The sync action should not break database relationships.
  - Design element: Decision 2.
  - Acceptance criteria reference: specs/import-sync/spec.md
  - Testability notes: Ensure the `overwrite: true` logic preserves the `id` field.

## Risks / Trade-offs

- Risk/trade-off: Users accidentally overwriting their character state.
  - Impact: Data loss of current HP, inventory, etc.
  - Mitigation: Explicit warning modal (Decision 3).

## Rollback / Mitigation

- Rollback trigger: The import API begins failing for all users due to a schema change on D&D Beyond.
- Rollback steps: Revert the code change or disable the sync button feature flag if one is used.
- Data migration considerations: Reverting the code will just ignore the `externalSync` field in the database; no explicit data rollback is needed.
- Verification after rollback: Test standard character import.

## Operational Blocking Policy

- If CI checks fail: The PR cannot be merged. Developer must fix tests/linting locally.
- If security checks fail: Same as CI.
- If required reviews are blocked/stale: Ping reviewers in Slack/GitHub; escalate to tech lead after 24 hours.
- Escalation path and timeout: Tech lead review if peer review is delayed beyond 2 days.

## Open Questions

- None.
