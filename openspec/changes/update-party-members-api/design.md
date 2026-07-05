## Context

- Relevant architecture: Next.js API Routes, custom `storage.ts` logic for data access, custom `withAuthAndParams` middleware.
- Dependencies: `storage.loadCharacters`, `storage.loadParties`, `storage.saveParty`.
- Interfaces/contracts touched: New route `app/api/campaigns/[campaignId]/members/[memberId]/parties/[partyId]/route.ts`.

## Goals / Non-Goals

### Goals

- Implement a sub-resource endpoint that allows players (or the GM) to manage a specific member's characters within a party.
- Safely merge character additions and removals without affecting other party members.

### Non-Goals

- Deprecating CampaignCharacterShare.
- Support for modifying the party's core metadata (name, description).

## Decisions

### Decision 1: Endpoint URL Structure

- Chosen: `PUT /api/campaigns/[campaignId]/members/[memberId]/parties/[partyId]`
- Alternatives considered: `PUT /api/campaigns/[campaignId]/parties/[partyId]/members`
- Rationale: Explicitly tracking `memberId` allows the same endpoint to be used by a player (for themselves) and by the GM (for any player), providing a cleaner and more RESTful approach.
- Trade-offs: Slightly deeper URL structure.

### Decision 2: Validation & Ownership

- Chosen: Use `storage.loadCharacters(memberId)` to validate that the requested `characterIds` belong to the member, rather than individual lookups.
- Alternatives considered: Calling `canAddToCampaignParty` iteratively.
- Rationale: More efficient, prevents N+1 queries.
- Trade-offs: Loads all characters for the user into memory, but user character counts are typically low.

### Decision 3: Member State Merge Logic

- Chosen: Calculate differences between payload IDs and the member's current active characters in the party. Set `addedAt` for new additions and `leftAt` for removals.
- Alternatives considered: Wiping out the entire array and rebuilding.
- Rationale: We need to preserve history (`leftAt` tracking) and leave other members' characters intact.
- Trade-offs: Slightly more complex array filtering logic.

## Proposal to Design Mapping

- Proposal element: Create a new endpoint for party management.
  - Design decision: Decision 1 (Endpoint URL Structure).
  - Validation approach: Integration tests calling the route as Player and GM.
- Proposal element: Merging player-provided characters.
  - Design decision: Decision 3 (Member State Merge Logic).
  - Validation approach: Unit/integration tests verifying other players' characters are untouched.
- Proposal element: Character ownership validation.
  - Design decision: Decision 2 (Validation & Ownership).
  - Validation approach: Try calling the endpoint with a character ID not owned by `memberId`.

## Functional Requirements Mapping

- Requirement: Player can add/remove their own characters.
  - Design element: The new PUT endpoint logic.
  - Acceptance criteria reference: Specs -> Player party management.
  - Testability notes: Test adding new ID, removing existing ID, and passing empty array.

- Requirement: GM can manage any player's characters in the party.
  - Design element: Auth check allows if the caller's campaign membership has `role === 'dm'` and `status === 'active'`.
  - Acceptance criteria reference: Specs -> GM party management.
  - Testability notes: Test with GM's token using another member's ID.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Endpoint must be secure against cross-tenant data modification.
  - Design element: `withAuthAndParams` middleware and strict validation against `loadCharacters(memberId)`.
  - Acceptance criteria reference: Specs -> Security.
  - Testability notes: Test unauthorized requests.

## Risks / Trade-offs

- Risk/trade-off: Complex array mutation.
  - Impact: Accidental loss of history if `leftAt` is omitted or overwritten.
  - Mitigation: Detailed unit tests covering the exact state of the `members` array before and after.

## Rollback / Mitigation

- Rollback trigger: Data corruption reports in parties.
- Rollback steps: Revert the PR and disable the endpoint.
- Data migration considerations: Reverting `leftAt` additions requires manual DB fix if widespread.
- Verification after rollback: Verify players can still use legacy share method.

## Operational Blocking Policy

- If CI checks fail: Developer must fix linting/tests. No force merging.
- If security checks fail: Same as CI.
- If required reviews are blocked/stale: Reach out to code owners after 24 hours.
- Escalation path and timeout: Timeout 48 hours, escalate to team lead.

## Open Questions

- None.
