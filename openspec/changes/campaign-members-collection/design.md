## Context

- Relevant architecture: MongoDB-backed Next.js app. All persistence goes through the `storage` object in `lib/storage.ts`. DB indexes and views are initialized in `lib/db.ts` `initializeDatabase()`. Auth middleware (`lib/middleware.ts`) provides `userId` at route boundaries.
- Dependencies: No external dependencies beyond existing `mongodb` driver. No dependency on issues 1a–1c.
- Interfaces/contracts touched:
  - `lib/types.ts` — adds new exported types
  - `lib/errors.ts` — new file, new exported error class
  - `lib/db.ts` — `initializeDatabase()` extended with a new index block
  - `lib/storage.ts` — four new methods on the `storage` object
  - `app/api/campaigns/route.ts` — POST handler seeds DM member after campaign save

## Goals / Non-Goals

### Goals

- Define the `CampaignMember` shape and enumerate roles as a const tuple (matching project pattern)
- Enforce `{campaignId, userId}` uniqueness at the DB layer
- Provide typed errors for duplicate membership
- Expose four focused storage methods with clear single responsibilities
- Seed DM membership atomically with campaign creation at the route boundary

### Non-Goals

- Member-aware access gating (issue 1e)
- Backfilling existing campaigns
- Invite/accept/decline API endpoints

## Decisions

### Decision 1: `MemberRole` as a const tuple (not a TypeScript `enum`)

- Chosen: `export const MEMBER_ROLES = ['dm', 'player'] as const; export type MemberRole = (typeof MEMBER_ROLES)[number];`
- Alternatives considered: Native TS `enum MemberRole { Dm = 'dm', Player = 'player' }`, plain string union `'dm' | 'player'`
- Rationale: Matches the existing `CAMPAIGN_STATUSES` pattern in `lib/types.ts`. Const tuples are serializable, runtime-iterable, and play nicely with MongoDB documents. Native enums add indirection and don't serialize cleanly.
- Trade-offs: Slightly less IDE autocomplete discoverability than a named enum, but consistent with codebase convention.

### Decision 2: `DuplicateMemberError` in a new `lib/errors.ts`

- Chosen: New `lib/errors.ts` exporting `DuplicateMemberError extends Error`
- Alternatives considered: Inline class in `lib/storage.ts`, adding to `lib/types.ts`
- Rationale: Storage is a persistence concern; a standalone errors module is reusable by routes, middleware, and future storage methods without creating circular imports.
- Trade-offs: One more file. Worth it for separation and future error types (e.g. `MemberNotFoundError` for 1e).

### Decision 3: Seeding DM membership at the route boundary (not inside `saveCampaign`)

- Chosen: `app/api/campaigns/route.ts` POST calls `storage.addMember(...)` after `storage.saveCampaign(...)`
- Alternatives considered: Wrapping both inside a new `storage.createCampaign()` method; seeding inside `saveCampaign` on insert detection
- Rationale: `saveCampaign` is a pure upsert — embedding side-effects breaks that contract. The route already holds `auth.userId` so it's the natural seeding boundary. Easier to test independently.
- Trade-offs: Two-write non-atomicity. Mitigated by deleting the campaign on `addMember` failure in the route handler.

### Decision 4: `listCampaignsForMember` returns `CampaignMemberSummary[]` (`{ id, name }`)

- Chosen: Cross-collection join: fetch campaignIds from `campaignMembers`, then lookup `{ id, name }` from `campaigns`
- Alternatives considered: Return only `campaignId[]`; return full `Campaign[]`
- Rationale: Callers (dashboard list, 1e access check) need at minimum the name for display. Returning full Campaign objects over-fetches. Returning only IDs pushes join logic to callers.
- Trade-offs: Two DB round-trips. Acceptable for a list that's bounded by the number of campaigns a user belongs to.

### Decision 5: `updateMember` uses named params, not a patch object

- Chosen: `updateMember(campaignId: string, userId: string, role?: MemberRole, status?: MemberStatus): Promise<void>`
- Alternatives considered: `updateMember(campaignId, userId, patch: Partial<CampaignMember>)`
- Rationale: Only two fields are mutable (role, status). Named optional params prevent callers from accidentally patching `campaignId`, `userId`, or `invitedBy`. Follows REST parameter-naming guidance.
- Trade-offs: Less flexible if new mutable fields are added — update the signature then.

## Proposal to Design Mapping

- Proposal element: `CampaignMember` type with role enum
  - Design decision: Decision 1 (const tuple)
  - Validation approach: TypeScript compilation; unit test asserts valid roles accepted, invalid rejected at type level

- Proposal element: Unique `{campaignId, userId}` index
  - Design decision: New index block in `initializeDatabase()` mirroring `password_reset_tokens` pattern
  - Validation approach: Integration test inserts duplicate and asserts `DuplicateMemberError`

- Proposal element: `DuplicateMemberError`
  - Design decision: Decision 2 (`lib/errors.ts`)
  - Validation approach: Integration test; unit test mocking mongo 11000 error

- Proposal element: DM seeding on campaign creation
  - Design decision: Decision 3 (route boundary)
  - Validation approach: Integration test POSTs a campaign and asserts `listMembersForCampaign` returns one active DM

- Proposal element: `listCampaignsForMember` returns `{ id, name }`
  - Design decision: Decision 4
  - Validation approach: Integration test creates two campaigns, adds member to both, asserts both appear with correct names

## Functional Requirements Mapping

- Requirement: Owner is always an active DM member after campaign creation
  - Design element: POST route seeds `addMember({ role: 'dm', status: 'active', ... })`; rollback deletes campaign on failure
  - Acceptance criteria reference: Issue 303 acceptance criterion 1
  - Testability notes: Integration test: POST `/api/campaigns` → `listMembersForCampaign` → assert DM record

- Requirement: Duplicate memberships rejected
  - Design element: MongoDB unique index + `DuplicateMemberError` wrapping error code 11000
  - Acceptance criteria reference: Issue 303 acceptance criterion 2
  - Testability notes: Integration test: `addMember` twice same pair → assert `DuplicateMemberError` thrown

- Requirement: Storage methods covered by tests
  - Design element: `campaigns.members.test.ts` (unit) + `campaigns.members.integration.test.ts`
  - Acceptance criteria reference: Issue 303 acceptance criterion 3
  - Testability notes: All four methods tested; both happy path and error paths

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Two-write campaign creation must not leave orphaned campaigns without DM members
  - Design element: Route handler catches `addMember` failure and deletes campaign
  - Acceptance criteria reference: Risk mitigation in proposal
  - Testability notes: Unit test: mock `addMember` to throw, assert `deleteCampaign` called

- Requirement category: security
  - Requirement: `listMembersForCampaign` and `listCampaignsForMember` must not leak cross-user data
  - Design element: `listMembersForCampaign` queries by `campaignId` only (access gating deferred to 1e); `listCampaignsForMember` queries by `userId`
  - Acceptance criteria reference: Out of scope for this issue; access gating is 1e
  - Testability notes: Note in test: access control is not enforced here, tested in 1e

- Requirement category: performance
  - Requirement: `listCampaignsForMember` join is bounded
  - Design element: Two sequential queries; no unbounded scans; `userId` indexed via membership query
  - Acceptance criteria reference: N/A — no explicit perf requirement at this scale
  - Testability notes: No perf test required at this stage

## Risks / Trade-offs

- Risk/trade-off: Non-atomic campaign + member creation
  - Impact: Orphaned campaign without DM member if second write fails
  - Mitigation: Route handler deletes campaign on `addMember` error

- Risk/trade-off: Mongo error code 11000 detection
  - Impact: `DuplicateMemberError` not thrown if driver changes error shape
  - Mitigation: Integration test verifies against real MongoDB

## Rollback / Mitigation

- Rollback trigger: `addMember` throws unexpectedly during campaign creation; or index creation breaks existing tests
- Rollback steps:
  1. Remove the four storage methods from `lib/storage.ts`
  2. Remove the index block from `lib/db.ts`
  3. Revert `app/api/campaigns/route.ts` to pre-seeding state
  4. Remove `lib/errors.ts` and type additions from `lib/types.ts`
- Data migration considerations: Index drop is safe; no data is written to `campaignMembers` until `addMember` is called
- Verification after rollback: Run `npm run test:unit` and `npm run test:integration`; confirm campaign POST still returns 201

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding.
- If security checks fail: Do not merge. Escalate to repo owner.
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate to repo owner after 48h.
- Escalation path and timeout: Repo owner (dougis) is the single approver; no external escalation path.

## Open Questions

No open questions. All design decisions confirmed during exploration session.
