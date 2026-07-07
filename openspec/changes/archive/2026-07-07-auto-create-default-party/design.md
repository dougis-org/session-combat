## Context

- Relevant architecture: Next.js route handler `app/api/campaigns/route.ts` (`POST`), wrapped in `withAuth`. Persistence goes through the singleton `storage` object in `lib/storage.ts` (`saveCampaign`, `deleteCampaign`, `addMember`, `saveParty`, `deleteParty`). Types live in `lib/types.ts` (`Campaign`, `CampaignMember`, `Party`, `PartyMember`).
- Dependencies: `Party` model and its storage functions (`storage.saveParty`, `storage.deleteParty`) already exist and are exercised today by `app/api/parties/route.ts`. No new model or storage function is required.
- Interfaces/contracts touched: only the internal implementation of `POST /api/campaigns`. Request and response shapes for that endpoint are unchanged.

## Goals / Non-Goals

### Goals

- Every campaign created via `POST /api/campaigns` ends up with exactly one `Party` (named "Main Party") linked via `campaignId`.
- Creation is atomic from the caller's perspective: either campaign + party + member all exist, or none do.
- No change to the `POST /api/campaigns` request or response contract.

### Non-Goals

- Backfilling parties for campaigns created before this ships (#479).
- Cascading deletes for `Party`/`CampaignMember` on campaign deletion (#480).
- Any UI change.

## Decisions

### Decision 1: Extend the existing three-step saga, party before member

- Chosen: Insert party creation between campaign save and member save: `saveCampaign` → `saveParty` → `addMember`. On failure of `addMember`, roll back by deleting the party then the campaign. On failure of `saveParty`, roll back by deleting the campaign. This mirrors the existing single-step rollback (member failure → delete campaign) by extending it one level, in the same nested try/catch style already present in the route.
- Alternatives considered:
  - Member before party: rejected — no functional difference in outcome, but party-before-member reads more naturally as "set up the campaign's structures, then add the person to it," and keeps the diff smaller since the existing member-rollback block only needs to grow by one extra delete call rather than being reordered around a new block.
  - Wrap all three saves in a single generic try/catch with a rollback list built dynamically (e.g. push cleanup functions onto a stack and pop-and-run on any failure): rejected as over-engineering for three fixed, sequential steps; the existing code already uses explicit nested try/catch for the two-step case, and this change should extend that shape rather than introduce a new abstraction for a three-step case.
- Rationale: Matches the project's established precedent of matching existing route patterns exactly rather than introducing new transaction abstractions (see campaign-copy route decision log).
- Trade-offs: Nesting one more level of try/catch is slightly more verbose than a generic rollback-stack helper, but keeps the change minimal and consistent with existing code the next reader will already recognize.

### Decision 2: Party shape — fixed name, empty members, campaignId set, userId = creator

- Chosen: `{ id: crypto.randomUUID(), userId: auth.userId, name: 'Main Party', description: '', members: [], campaignId: campaign.id, createdAt: now, updatedAt: now }`, saved via `storage.saveParty`.
- Alternatives considered: Deriving name from campaign name (e.g. `${campaign.name} Party`) — rejected per explicit decision; keeps naming simple and predictable, and the party can be renamed later through existing party-editing flows.
- Rationale: Matches the shape already produced by `POST /api/parties` (`app/api/parties/route.ts`) for consistency, minus `characterIds` (none exist yet).
- Trade-offs: None significant; DM must rename manually if "Main Party" isn't desired, which is an accepted, low-cost trade-off.

### Decision 3: No response contract change

- Chosen: `POST /api/campaigns` continues to return the `Campaign` object only (201). The created `Party` is not included in the response body.
- Alternatives considered: Returning `{ campaign, party }` — rejected to avoid breaking existing consumers (`CampaignEditor.tsx`, `tests/unit/api/campaigns/route.test.ts`, `tests/integration/campaigns.integration.test.ts`) that currently expect the response body to be the campaign itself.
- Rationale: Explicit decision from exploration; the party is discoverable via `GET /api/parties` or `GET /api/campaigns/[id]` contexts already used elsewhere (e.g. `CampaignContext.parties`).
- Trade-offs: Client that wants to show the new party immediately after creating a campaign must make a follow-up fetch; acceptable since no current UI flow needs this yet.

## Proposal to Design Mapping

- Proposal element: Extend `POST /api/campaigns` to create a default "Main Party"
  - Design decision: Decision 1, Decision 2
  - Validation approach: Integration test asserting a `Party` with `campaignId` equal to the new campaign's id and `name: 'Main Party'` exists after a successful `POST /api/campaigns` call.
- Proposal element: Rollback on partial failure
  - Design decision: Decision 1
  - Validation approach: Unit tests mocking `storage.addMember` and `storage.saveParty` to reject, asserting `storage.deleteParty`/`storage.deleteCampaign` are called with the right arguments and the route still returns a 500.
- Proposal element: No response contract change
  - Design decision: Decision 3
  - Validation approach: Existing `tests/unit/api/campaigns/route.test.ts` / `tests/integration/campaigns.integration.test.ts` continue to assert the response body equals the `Campaign` shape with no added `party` key; add an explicit assertion that the response does not include a `party` field to lock in the contract.

## Functional Requirements Mapping

- Requirement: A default `Party` named "Main Party" is created and linked to every new campaign.
  - Design element: Decision 1, Decision 2
  - Acceptance criteria reference: specs — "default party creation"
  - Testability notes: Directly assertable via integration test querying parties by `campaignId` after campaign creation.
- Requirement: Failure of any creation step rolls back all previously completed steps.
  - Design element: Decision 1
  - Acceptance criteria reference: specs — "rollback on partial failure"
  - Testability notes: Requires mocking `storage` methods to simulate failure at each step (party save fails, member save fails) and asserting cleanup calls and final DB state.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No orphaned `Campaign`, `Party`, or `CampaignMember` rows after a failed creation attempt.
  - Design element: Decision 1 (ordered rollback)
  - Acceptance criteria reference: specs — "rollback on partial failure"
  - Testability notes: Integration test simulating downstream failure and then querying storage directly to confirm no rows remain for the attempted campaign id.

## Risks / Trade-offs

- Risk/trade-off: Rollback itself can fail (e.g. `deleteParty` throws during cleanup after `addMember` failed).
  - Impact: Orphaned `Party` and/or `Campaign` rows, same class of issue the existing code already accepts for the member-rollback case (it logs and continues rather than retrying).
  - Mitigation: Match existing behavior exactly — log the rollback error via `console.error` and continue re-throwing the original error, same as the current `catch (memberError)` block does for `rollbackError`. Not a regression; consistent with current risk acceptance.

## Rollback / Mitigation

- Rollback trigger: `storage.saveParty` throws, or `storage.addMember` throws, during `POST /api/campaigns`.
- Rollback steps:
  1. If `addMember` fails: call `storage.deleteParty(party.id, auth.userId)`, then `storage.deleteCampaign(campaign.id, auth.userId)`, each in its own try/catch that logs on failure without swallowing the original error.
  2. If `saveParty` fails: call `storage.deleteCampaign(campaign.id, auth.userId)` in a try/catch that logs on failure without swallowing the original error.
- Data migration considerations: None — no schema change, no existing data touched.
- Verification after rollback: Integration tests assert that after a simulated downstream failure, no `Campaign`, `Party`, or `CampaignMember` row exists for the attempted creation.

## Operational Blocking Policy

- If CI checks fail: Fix the failing test/lint before merge; this is a small, self-contained route change with no infra dependency, so CI failures should block merge until resolved.
- If security checks fail: Treat as blocking; re-review the rollback logging to ensure no sensitive data (e.g. raw error objects containing user input) is logged in a way that violates existing sanitization practices.
- If required reviews are blocked/stale: Follow standard repo PR process — no special exception for this change.
- Escalation path and timeout: Standard team PR review process; no dedicated on-call impact since this is not a production-incident-triggering path.

## Open Questions

None — see proposal.md Open Questions section.
