## Context

- Relevant architecture: Next.js App Router API routes under `app/api/`; MongoDB via `lib/storage.ts`; auth via `withAuth` middleware; `lib/types.ts` as the shared type contract.
- Dependencies: Phase 1 complete — `getMember`, `loadCampaignByIdAny`, `addMember`, user search API (`GET /api/users/search`) all exist.
- Interfaces/contracts touched: `CampaignMember` (type), `MemberStatus` (type), `storage.addMember`, `storage.updateMember` (replaced), new `storage.updateMemberStatus`.

## Goals / Non-Goals

### Goals

- Add `POST /api/campaigns/[id]/members` with DM-only guard, self-invite guard, and upsert logic
- Migrate `CampaignMember` schema from flat scalar fields to append-only `history` array
- Replace `storage.updateMember` with `storage.updateMemberStatus` (atomic status + history push)
- Keep `status` as a top-level field on `CampaignMember` for query efficiency

### Non-Goals

- Accept/decline, removal, UI, notifications (out of scope per proposal)

## Decisions

### Decision 1: `MemberStatus` uses `"invited"` (not `"pending"`) and adds `"removed"`

- Chosen: `"active" | "invited" | "declined" | "removed"`
- Alternatives considered: keep `"pending"` as an alias; separate enum for the invite flow
- Rationale: Phase doc and issue spec use `"invited"` consistently. No existing data means no migration cost. `"removed"` is needed now so the re-invite upsert path (`removed → invited`) can pattern-match on it correctly — deferring it would leave a gap in the state machine.
- Trade-offs: Future sub-issues (2b, 2c) must use the same type; acceptable since this is a shared contract they already depend on.

### Decision 2: Append-only `history: MemberHistoryEntry[]` replaces flat scalar fields

- Chosen: Remove `invitedBy`, `invitedAt`, `respondedAt` from `CampaignMember`; add `history: MemberHistoryEntry[]` where each entry is `{ action: MemberStatus; by: string; at: Date }`.
- Alternatives considered: Keep flat fields and add history as an additive parallel field; derive `status` from last history entry (no separate `status` field).
- Rationale: Flat fields cannot represent re-invite cycles (which DM invited, when). History as a list gives full audit trail at no query cost. `status` is kept as a top-level denormalized field so filter queries (`find({ campaignId, status: 'invited' })`) remain simple index-friendly operations without `$arrayElemAt`.
- Trade-offs: `addMember` callers must now construct the initial history entry. Slightly more verbose at call sites, but structurally correct.

### Decision 3: `action` field in `MemberHistoryEntry` mirrors `MemberStatus` (state transitioned to)

- Chosen: `action: MemberStatus` — records the state the member moved *into*.
- Alternatives considered: Separate verb vocabulary (`"invite"`, `"accept"`, `"decline"`, `"remove"`).
- Rationale: A separate verb type would need to stay in sync with `MemberStatus` and adds surface area for divergence. Using `MemberStatus` directly means the history is self-describing: `{ action: 'invited' }` means "transitioned to invited". No additional type needed.
- Trade-offs: The `history` array records state transitions, not free-form events. Sufficient for this domain.

### Decision 4: Replace `updateMember` with `updateMemberStatus`

- Chosen: `updateMemberStatus(campaignId, userId, status: MemberStatus, actorId: string): Promise<void>` — single MongoDB `updateOne` with `{ $set: { status }, $push: { history: { action: status, by: actorId, at: new Date() } } }`.
- Alternatives considered: Extend existing `updateMember` with optional history params; add a separate `appendHistory` storage method.
- Rationale: `updateMember` has zero application callers (verified by grep). A clean replacement is safer than extending with optional params that could be misused. Combining `$set` and `$push` in one `updateOne` is atomic at the document level in MongoDB — no transaction needed.
- Trade-offs: Callers that previously set `role` independently via `updateMember` no longer have that path. Role changes are not in scope for Phase 2; a `updateMemberRole` can be added in 2c if needed.

### Decision 5: Upsert via `getMember` + conditional `addMember`/`updateMemberStatus`

- Chosen: Read-then-write pattern using existing `getMember`.
  - No existing member → `addMember` with `status: 'invited'`, `history: [{ action: 'invited', by: dmId, at: now }]`
  - Existing with `status: 'declined'` or `'removed'` → `updateMemberStatus('invited', dmId)` (clears nothing; history just grows)
  - Existing with `status: 'active'` or `'invited'` → `409 Conflict`
- Alternatives considered: MongoDB native upsert (`findOneAndUpdate` with `$setOnInsert`); separate invite/reinvite endpoints.
- Rationale: The conditional branching (reject active/invited, allow declined/removed) cannot be expressed as a simple MongoDB filter-based upsert. Read-then-write is explicit and testable. The window for a race condition (two concurrent invites) is small and the unique index on `{campaignId, userId}` catches it — `addMember` will throw `DuplicateMemberError` which maps to 409.
- Trade-offs: Two DB round trips on the re-invite path. Acceptable at this scale.

### Decision 6: Response shape is `201 { id, status }`

- Chosen: Return only `{ id: string; status: MemberStatus }` on success.
- Alternatives considered: Return full `CampaignMember` document.
- Rationale: The UI for 2c (member management) will use the member list endpoint to display state, not the invite response. A minimal response reduces payload and avoids exposing history to the caller unnecessarily.
- Trade-offs: If future UIs need the full member immediately on invite, this can be changed without breaking existing callers.

## Proposal to Design Mapping

- Proposal element: `MemberStatus` updated, `"removed"` added now
  - Design decision: Decision 1
  - Validation approach: TypeScript compile-time; unit tests check all status values
- Proposal element: `history: MemberHistoryEntry[]` replaces flat fields
  - Design decision: Decisions 2 & 3
  - Validation approach: Unit tests on `addMember` verify history array structure
- Proposal element: `updateMember` → `updateMemberStatus`
  - Design decision: Decision 4
  - Validation approach: Unit tests on storage method; integration via route tests
- Proposal element: Upsert logic (three branches)
  - Design decision: Decision 5
  - Validation approach: Route unit tests with one test per branch
- Proposal element: Response `{ id, status }`
  - Design decision: Decision 6
  - Validation approach: Route unit test asserts response body shape

## Functional Requirements Mapping

- Requirement: DM can invite a user by userId
  - Design element: POST handler, `addMember` branch
  - Acceptance criteria reference: specs/invite-api/spec.md — Scenario: Successful invite
  - Testability notes: Mock `getMember` returning null, assert `addMember` called and 201 returned

- Requirement: Non-DM cannot invite
  - Design element: Guard — `getMember(campaignId, callerId)` must return active DM
  - Acceptance criteria reference: specs/invite-api/spec.md — Scenario: Non-DM invite rejected
  - Testability notes: Mock `getMember` returning player or null; assert 403

- Requirement: Self-invite rejected
  - Design element: Guard — `userId === callerId` check before DB access
  - Acceptance criteria reference: specs/invite-api/spec.md — Scenario: Self-invite rejected
  - Testability notes: POST with userId === auth.userId; assert 400

- Requirement: Active/invited duplicate rejected
  - Design element: Upsert branch — `status: 'active'|'invited'` → 409
  - Acceptance criteria reference: specs/invite-api/spec.md — Scenario: Duplicate rejected
  - Testability notes: Mock `getMember` returning active/invited member; assert 409

- Requirement: Re-invite declined/removed member succeeds
  - Design element: Upsert branch — `updateMemberStatus('invited', dmId)`
  - Acceptance criteria reference: specs/invite-api/spec.md — Scenario: Re-invite succeeds
  - Testability notes: Mock `getMember` returning declined/removed; assert `updateMemberStatus` called, 201 returned

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Concurrent duplicate invites handled gracefully
  - Design element: Unique index on `{campaignId, userId}` catches race; `DuplicateMemberError` → 409
  - Testability notes: Unit test for `addMember` throwing `DuplicateMemberError`; route maps it to 409

- Requirement category: security
  - Requirement: Only authenticated DMs of a given campaign can invite
  - Design element: `withAuth` + `getMember` DM check
  - Testability notes: Unauthenticated request → 401 (withAuth); non-DM → 403

- Requirement category: operability
  - Requirement: Storage errors surface as 500 without leaking internals
  - Design element: try/catch in route handler; generic error response
  - Testability notes: Mock storage throwing; assert 500

## Risks / Trade-offs

- Risk/trade-off: Read-then-write race for concurrent invites
  - Impact: Low — unique index is the safety net; results in 409, not data corruption
  - Mitigation: `DuplicateMemberError` from `addMember` mapped to 409 in route handler

- Risk/trade-off: `updateMemberStatus` does not reset `respondedAt` (field no longer exists)
  - Impact: None — `respondedAt` is removed from the schema; history entries have their own `at` timestamps
  - Mitigation: N/A — schema change eliminates the issue

## Rollback / Mitigation

- Rollback trigger: Critical bug in invite route or type regression breaking existing campaign creation
- Rollback steps: Revert the PR; no DB migration to undo (no data written to prod yet)
- Data migration considerations: None — no existing `campaignMembers` documents
- Verification after rollback: Campaign creation smoke test; existing unit tests pass

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check. No --no-verify bypasses.
- If security checks fail: Treat as a blocker. Assess scope and fix before merge.
- If required reviews are blocked/stale: Re-request after 24h; escalate to maintainer after 48h.
- Escalation path and timeout: If blocked > 48h with no response, flag in the GitHub issue thread.

## Open Questions

No open questions. All design decisions resolved during exploration session prior to proposal creation.
