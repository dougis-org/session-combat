## Context

- Relevant architecture: Next.js App Router API routes under `app/api/campaigns/[id]/**`. All routes use `withAuthAndParams` middleware which injects `auth.userId`. Storage layer is MongoDB via `lib/storage.ts`. Access helpers live in `lib/utils/campaign.ts`.
- Dependencies: `campaignMembers` collection and storage methods (`addMember`, `updateMember`, `listMembersForCampaign`, `listCampaignsForMember`) shipped in issue #303 (1d). Owner is seeded as `active` DM in `campaignMembers` at campaign creation time.
- Interfaces/contracts touched: `lib/storage.ts` (new methods), `lib/utils/campaign.ts` (new helper), all six route handlers under `app/api/campaigns/[id]/**`.

## Goals / Non-Goals

### Goals

- Any `active` campaign member (DM or player) can execute GET requests on all `[id]/**` routes.
- Write operations (PATCH, DELETE, POST, sessions PATCH) are restricted to members with `role === 'dm'`.
- Non-members and inactive members receive 404 — no information about campaign existence is leaked.
- The membership check is consolidated in one place (`assertCampaignAccess`) rather than duplicated across routes.

### Non-Goals

- Invite/accept flow or membership management UI
- Exposing member roles in API response bodies
- Changing access semantics for routes outside `app/api/campaigns/[id]/**`

## Decisions

### Decision 1: Membership as the sole access gate (no owner bypass)

- Chosen: Always check `campaignMembers` for access. The owner (DM) is already seeded as an `active` member with `role: 'dm'`, so the membership table is authoritative for all users including the owner.
- Alternatives considered: Check `campaign.userId === auth.userId` first, fall back to membership — this dual-path approach avoids touching the owner seeding but creates two code paths.
- Rationale: Single code path, easier to reason about and test. Consistent with the 1d design where the owner is explicitly represented in `campaignMembers`.
- Trade-offs: Depends on the owner-seeding backfill migration from #303 having run. Documented in proposal risks.

### Decision 2: `assertCampaignAccess` return type follows existing `X | NextResponse` pattern

- Chosen: `Promise<{ campaign: Campaign; role: MemberRole } | NextResponse>`. Routes check `instanceof NextResponse` and early-return, matching the existing `findCampaign` convention.
- Alternatives considered: Throw a typed `CampaignAccessError`; return a discriminated union `{ ok: true; ... } | { ok: false; response: NextResponse }`.
- Rationale: The existing `findCampaign` in `app/api/campaigns/[id]/route.ts` already returns `Campaign | NextResponse`. Using the same shape means route handlers change minimally and the pattern is already understood by readers of the codebase.
- Trade-offs: Couples a utility function to `NextResponse`; acceptable because the utility is route-layer code.

### Decision 3: Deny with 404 for non-members and role violations

- Chosen: Both non-member access and player-attempts-write return `{ error: 'Campaign not found' }` with status 404.
- Alternatives considered: 403 Forbidden for members who lack the right role.
- Rationale: 404 prevents leaking that a campaign exists at all, or that the caller is a member but lacks permission. Matches the issue spec ("non-member gets 404/403" — 404 chosen for uniform denial).
- Trade-offs: Slightly harder to debug for legitimate users who are misconfigured; acceptable at this stage.

### Decision 4: Two new storage methods — `getMember` and `loadCampaignByIdAny`

- Chosen: Add `getMember(campaignId, userId): Promise<CampaignMember | null>` for targeted member lookup, and `loadCampaignByIdAny(id): Promise<Campaign | null>` for owner-agnostic campaign load.
- Alternatives considered: Reuse `listMembersForCampaign` and filter client-side (wastes bandwidth), modify `loadCampaignById` signature to make userId optional (breaks existing callers).
- Rationale: Minimal footprint — both methods are small, targeted, and don't change existing method signatures. `loadCampaignByIdAny` is intentionally named to signal it bypasses ownership; only `assertCampaignAccess` should call it.
- Trade-offs: Slight surface area expansion in storage; mitigated by clear naming.

### Decision 5: Write routes use `assertCampaignAccess` + inline `role` check

- Chosen: All write routes call `assertCampaignAccess`, destructure `role`, then return 404 if `role !== 'dm'`. The existing `findCampaign` helper is removed from the campaign route.
- Alternatives considered: Keep `findCampaign` for write paths (owner-only stays as-is).
- Rationale: Unified access pattern; paves the way for future multi-DM or ownership-transfer features without a second code path to update.
- Trade-offs: Writes now incur two DB round trips (getMember + loadCampaignByIdAny) vs one; acceptable at this scale.

## Proposal to Design Mapping

- Proposal element: Player members blocked by `{ id, userId }` query
  - Design decision: Decision 4 — `loadCampaignByIdAny` removes userId filter after membership is confirmed
  - Validation approach: Integration test — player member GET returns 200 with campaign body

- Proposal element: Non-members get 404
  - Design decision: Decision 3 — uniform 404 for denied access
  - Validation approach: Integration test — unknown userId GET returns 404

- Proposal element: Writes remain DM-only
  - Design decision: Decision 5 — `role !== 'dm'` → 404 in write routes
  - Validation approach: Integration test — player member PATCH/DELETE/POST returns 404

- Proposal element: Single authoritative gate
  - Design decision: Decision 1 — membership is sole gate; Decision 2 — `assertCampaignAccess` consolidates logic
  - Validation approach: Unit tests on `assertCampaignAccess` covering all branches

- Proposal element: Backfill risk for legacy campaigns
  - Design decision: Decision 1 (trade-off) — documented as prerequisite; no code mitigation in this change
  - Validation approach: Manual verification that #303 backfill ran before deploy

## Functional Requirements Mapping

- Requirement: Active member (any role) can GET `/api/campaigns/[id]`
  - Design element: `assertCampaignAccess` returns `{ campaign, role }` on success; route returns `NextResponse.json(campaign)`
  - Acceptance criteria reference: specs/campaign-access.md — Scenario: Player member GET succeeds
  - Testability notes: Mock `storage.getMember` returning active player, `loadCampaignByIdAny` returning campaign

- Requirement: Active DM can PATCH/DELETE `/api/campaigns/[id]`
  - Design element: `assertCampaignAccess` + `role === 'dm'` check in route
  - Acceptance criteria reference: specs/campaign-access.md — Scenario: DM write succeeds
  - Testability notes: Mock getMember returning active dm, verify response 200/204

- Requirement: Non-member gets 404
  - Design element: `getMember` returns null → `assertCampaignAccess` returns 404 NextResponse
  - Acceptance criteria reference: specs/campaign-access.md — Scenario: Non-member denied
  - Testability notes: Mock getMember returning null

- Requirement: Pending/declined member gets 404
  - Design element: `member.status !== 'active'` → 404
  - Acceptance criteria reference: specs/campaign-access.md — Scenario: Inactive member denied
  - Testability notes: Mock getMember returning pending/declined member

- Requirement: Player PATCH/DELETE/POST returns 404
  - Design element: `role !== 'dm'` → 404 in write route handlers
  - Acceptance criteria reference: specs/campaign-access.md — Scenario: Player write denied
  - Testability notes: Mock getMember returning active player; assert 404

- Requirement: Sessions GET accessible to active members
  - Design element: `assertCampaignAccess` replaces `loadCampaignById` gate in sessions GET
  - Acceptance criteria reference: specs/campaign-access.md — Scenario: Player sessions GET
  - Testability notes: Mock membership + session logs

- Requirement: Combat events GET accessible to active members
  - Design element: `assertCampaignAccess` gate added to combat-events GET; query still filters `userId: auth.userId`
  - Acceptance criteria reference: specs/campaign-access.md — Scenario: Player combat events GET
  - Testability notes: Gate check passes; underlying query unchanged

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: No campaign existence leakage to non-members
  - Design element: Uniform 404 on all denial paths (Decision 3)
  - Acceptance criteria reference: specs/campaign-access.md — Scenario: Non-member denied
  - Testability notes: Assert response body is `{ error: 'Campaign not found' }` and status is 404 in all denial cases

- Requirement category: performance
  - Requirement: Access check adds at most 2 DB round trips
  - Design element: `getMember` (indexed query on `{ campaignId, userId }`) + `loadCampaignByIdAny` (indexed query on `{ id }`)
  - Acceptance criteria reference: N/A — no perf regression test; existing indexes from #303 cover the compound key
  - Testability notes: Index existence verified in #303 spec; no additional action needed here

- Requirement category: reliability
  - Requirement: Existing owner-only behavior unchanged for campaigns not yet using membership
  - Design element: Owner seeded as active DM in #303 — same code path applies
  - Acceptance criteria reference: specs/campaign-access.md — Scenario: Owner (DM) existing behavior unchanged
  - Testability notes: Mock getMember returning active dm with matching userId

## Risks / Trade-offs

- Risk/trade-off: `loadCampaignByIdAny` bypasses ownership filter
  - Impact: If called without a prior membership check, any user could fetch any campaign
  - Mitigation: Method is only called inside `assertCampaignAccess`. Code review to enforce this invariant.

- Risk/trade-off: Backfill dependency on #303
  - Impact: Pre-#303 campaigns have no membership record; their owners would receive 404 after this change deploys
  - Mitigation: Confirm backfill ran before deploy; this is a prerequisite, not a code issue in this change.

## Rollback / Mitigation

- Rollback trigger: Owners of existing campaigns unable to access their campaigns (404); or unexpected 404s in production after deploy.
- Rollback steps: Revert the PR for this change. Routes revert to `findCampaign` / `loadCampaignById` owner-only pattern. No schema migration to undo.
- Data migration considerations: None — this change only adds route logic and storage methods. No data is written or deleted.
- Verification after rollback: Confirm campaign owner can GET their own campaign. Confirm campaign list endpoint still works.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check in the branch. Do not use `--no-verify` or admin bypass.
- If security checks fail: Treat as a blocker. Review the flagged code and resolve before merging.
- If required reviews are blocked/stale: Re-request review after 24 hours. Escalate to project owner after 48 hours.
- Escalation path and timeout: Ping project owner directly if blocked more than 48 hours with no response.

## Open Questions

- No open questions. All design decisions were confirmed during the explore session preceding this proposal.
