## Context

- Relevant architecture: MongoDB-backed persistence layer in `lib/storage.ts`, a flat object of async functions (no ORM, no transactions anywhere in the codebase). `deleteCampaign(id, userId)` (lib/storage.ts:318) is called from `DELETE /api/campaigns/[id]` (app/api/campaigns/[id]/route.ts:94) and, separately, as a best-effort rollback helper from `app/api/campaigns/route.ts` (POST handler) and `app/api/campaigns/global/[id]/copy/route.ts`.
- Dependencies: none new. Uses the existing MongoDB driver (`mongodb` npm package) already imported in `lib/storage.ts`.
- Interfaces/contracts touched: `storage.deleteCampaign(id: string, userId: string): Promise<void>` — signature is unchanged, only its internal behavior gains a cascade step. No callers need to change.

## Goals / Non-Goals

### Goals

- `storage.deleteCampaign` removes the `Campaign` document AND all rows in `parties`, `campaignMembers`, `sessionLogs`, `campaignRolls`, `campaignCharacterShares`, `savedContent`, and `campaignMessages` that reference that campaign.
- Cascade behaves as a safe no-op when a collection has no matching rows.
- Cascade does not change behavior at the existing rollback call sites beyond making them slightly more thorough (harmless).

### Non-Goals

- Transactional/atomic guarantees across the cascade + final delete.
- Changing the `deleteCampaign` function signature or any caller.
- Any UI or API contract change.

## Decisions

### Decision 1: Cascade shape — parallel `deleteMany` per collection, following the `storage.clear()` precedent

- Chosen: Inside `deleteCampaign`, run a `Promise.all` of seven `deleteMany` calls (one per campaign-scoped collection), filtered by `campaignId` (and `userId` for collections that carry it), then delete the `Campaign` document itself.
- Alternatives considered:
  - MongoDB multi-document transaction (`session.withTransaction`) for true atomicity.
  - Sequential deletes (one collection at a time, awaited in series).
- Rationale: `storage.clear(userId)` (lib/storage.ts:1256-1272) already establishes this exact pattern — a `Promise.all` of `deleteMany` calls across `parties`, `campaignMembers`, `campaignCharacterShares` — for full account deletion. No other function in this codebase uses transactions. Matching the existing precedent keeps the fix idiomatic and low-risk; introducing transactions here would be a larger, unrelated infrastructure change.
- Trade-offs: Not atomic — see Decision 2 for how ordering mitigates the practical impact of that.

### Decision 2: Ordering — delete children first, `Campaign` document last

- Chosen: The seven `deleteMany` calls run (in parallel) before the `campaigns.deleteOne` call, not after.
- Alternatives considered: Delete the `Campaign` document first, then clean up children.
- Rationale: Without transactions, a crash/failure partway through leaves an inconsistent state either way. Deleting children first means that if the process dies before reaching `campaigns.deleteOne`, the `Campaign` document still exists — the delete is naturally retryable (calling `deleteCampaign` again re-runs the now-mostly-no-op cascade and then removes the campaign). Deleting the `Campaign` document first and crashing before the cascade completes would silently reproduce the exact orphan bug this change fixes, with no way to detect it because the parent campaign is already gone.
- Trade-offs: A failure between the cascade and the final delete could theoretically re-run `deleteMany` cascade calls that already succeeded on retry — harmless, since `deleteMany` matching zero documents is a no-op.

### Decision 3: Collection scoping — filter by `campaignId` plus `userId` only where the collection is strictly DM-owned, and by `campaignId` alone for shared collections

- Chosen: `sessionLogs` filter includes both `campaignId` and `userId` (strictly DM-owned logs). `parties`, `campaignMembers`, `campaignRolls`, `campaignCharacterShares`, `savedContent`, and `campaignMessages` filter by `campaignId` alone.
- Alternatives considered: Scoping parties and shares by `{ campaignId, userId }`.
- Rationale: While `Party`, `CampaignCharacterShare`, `SavedContent`, and `CampaignMessage` entities are user-scoped (storing the creator's `userId`), they can exist for multiple users within the same campaign. Scoping the delete cascade by the DM's `userId` would leave other users' records orphaned. Therefore, these collections are cleared campaign-wide by `campaignId` alone.
- Trade-offs: Asymmetric filter shape across collections; documented here to ensure clarity.

## Proposal to Design Mapping

- Proposal element: Cascade-delete `parties`, `campaignMembers`, `sessionLogs`, `campaignRolls`, `campaignCharacterShares`, `savedContent`, and `campaignMessages` on campaign delete.
  - Design decision: Decision 1 (parallel `deleteMany` cascade shape) + Decision 3 (per-collection filter scoping)
  - Validation approach: Unit test seeds rows in all seven collections for a campaign, calls `deleteCampaign`, asserts all seven are empty and the `Campaign` doc is gone.
- Proposal element: No transactions; best-effort consistent with existing codebase patterns.
  - Design decision: Decision 1
  - Validation approach: Code review confirms no `session`/`withTransaction` usage introduced; matches `storage.clear()` style.
- Proposal element: Rollback call sites must not break.
  - Design decision: Decision 1 + 2 (cascade is a safe no-op when nothing exists yet, or when children were already manually deleted)
  - Validation approach: Existing tests in `tests/unit/api/campaigns/route.test.ts` and `tests/unit/api/campaigns/global.id.copy.route.test.ts` that assert rollback behavior continue to pass unmodified (they mock `storage.deleteCampaign` at the boundary, so this cascade fix lives entirely inside the real implementation and isn't visible to those mocks).

## Functional Requirements Mapping

- Requirement: Deleting a campaign removes all `Party` rows with matching `campaignId`.
  - Design element: Decision 1, Decision 3
  - Acceptance criteria reference: specs/campaign-deletion/spec.md — "Cascade deletes campaign-scoped Party rows"
  - Testability notes: Seed 2+ parties for the campaign (plus 1 unrelated party for another campaign), call `deleteCampaign`, assert only the campaign's parties are gone.
- Requirement: Deleting a campaign removes all `CampaignMember` rows with matching `campaignId`, regardless of which user owns each membership.
  - Design element: Decision 3
  - Acceptance criteria reference: specs/campaign-deletion/spec.md — "Cascade deletes campaign-scoped CampaignMember rows for all members"
  - Testability notes: Seed members for two different `userId`s under the same `campaignId`; assert both are removed after the DM calls delete.
- Requirement: Deleting a campaign removes all `SessionLog`, `CampaignRoll`, `CampaignCharacterShare`, `SavedContent`, and `CampaignMessage` rows with matching `campaignId`.
  - Design element: Decision 1, Decision 3
  - Acceptance criteria reference: specs/campaign-deletion/spec.md — "Cascade deletes remaining campaign-scoped collections"
  - Testability notes: Same seed/assert pattern per collection.
- Requirement: Deleting a campaign with no children in some/all collections does not error.
  - Design element: Decision 1 (deleteMany no-op semantics)
  - Acceptance criteria reference: specs/campaign-deletion/spec.md — "No-op cascade does not throw"
  - Testability notes: Call `deleteCampaign` on a campaign with zero seeded children; assert it resolves without throwing (mirrors existing test at tests/unit/storage/campaigns.test.ts:149 for the nonexistent-campaign case).

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: A crash between cascade and final delete must leave the operation retryable, not silently corrupt.
  - Design element: Decision 2 (children-first ordering)
  - Acceptance criteria reference: specs/campaign-deletion/spec.md — "Ordering guarantees retryability"
  - Testability notes: Not practically unit-testable (requires simulating a mid-operation crash); covered by design review/reasoning only, called out explicitly here rather than left implicit.
- Requirement category: performance
  - Requirement: Cascade must not serialize seven sequential round-trips where parallel is safe.
  - Design element: Decision 1 (`Promise.all`)
  - Acceptance criteria reference: N/A (not spec-level; implementation detail)
  - Testability notes: Verified by code inspection during review; no dedicated perf test needed at this scale.

## Risks / Trade-offs

- Risk/trade-off: Non-atomic cascade (Decision 1).
  - Impact: Rare partial-completion state on crash; recoverable via retry per Decision 2.
  - Mitigation: Document ordering rationale (this file); no other codepath in this project has transactional atomicity either, so this doesn't regress a standard that didn't exist.
- Risk/trade-off: Asymmetric per-collection filter scoping (Decision 3).
  - Impact: Slightly harder to read/maintain than a uniform filter.
  - Mitigation: Each filter matches that collection's existing query pattern elsewhere in `storage.ts`; comment inline in the implementation if needed.

## Rollback / Mitigation

- Rollback trigger: If the cascade is found to delete more or less than intended in production (e.g., a filter bug orphans rows in a sixth collection someone forgot, or over-deletes rows belonging to a different campaign).
- Rollback steps: Revert the `lib/storage.ts` change (single function, single commit) to restore the pre-change `deleteCampaign` behavior (Campaign-doc-only delete). No schema or migration changes are made by this change, so reverting the code fully reverts behavior.
- Data migration considerations: None — this change only affects future deletes. It does not backfill/clean up rows already orphaned by past deletions (that would be a separate, explicit data-cleanup task, out of scope here per proposal.md).
- Verification after rollback: Re-run `tests/unit/storage/campaigns.test.ts` to confirm `deleteCampaign` returns to deleting only the `Campaign` document.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the change branch before merging; this is a small, self-contained storage-layer change with no external dependencies, so CI failures should be resolved directly rather than bypassed.
- If security checks fail: Investigate before overriding — this change touches only internal delete filters on already-authenticated/authorized code paths (campaign ownership is checked in the route handler before `deleteCampaign` is called), so a security finding would indicate a filter bug, not a false positive to suppress.
- If required reviews are blocked/stale: Escalate to the requester (dougis) directly; this is a single-person project with no separate review queue observed in this repo's workflow.
- Escalation path and timeout: No formal SLA; follow up with the requester if the PR sits unreviewed beyond a normal working day.

## Open Questions

- None blocking. Scope and approach were settled during exploration and carried into proposal.md without unresolved ambiguity.
