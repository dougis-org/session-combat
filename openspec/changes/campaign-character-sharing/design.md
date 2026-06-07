## Context

- **Relevant architecture:** Next.js App Router API routes; MongoDB via `lib/storage.ts`; `withAuthAndParams` middleware for authenticated route handlers; `lib/errors.ts` for typed domain errors; `lib/types.ts` for shared types.
- **Dependencies:** Phase 1 (1e) fully merged — `campaignMembers` collection, `getMember`, `addMember`, `updateMemberStatus`, `listMembersForCampaign`, and `DuplicateMemberError` all exist. Character ownership check follows the pattern in `app/api/characters/[id]/route.ts` (DELETE handler).
- **Interfaces/contracts touched:** `lib/types.ts`, `lib/errors.ts`, `lib/storage.ts`, new API routes under `app/api/campaigns/[id]/characters/`, campaign view UI component.

## Goals / Non-Goals

### Goals

- Add `CampaignCharacterShare` data type and `campaignCharacterShares` collection with uniqueness enforced by MongoDB index.
- Add `DuplicateShareError` following the exact pattern of `DuplicateMemberError`.
- Add `addShare`, `removeShare`, `listSharesForCampaign` to `storage` following the existing member method patterns.
- Expose share/unshare/list via three REST endpoints under `/api/campaigns/[id]/characters/`.
- Render a share-management panel on the campaign view for players (hidden from DMs).

### Non-Goals

- Party builder integration (3b).
- Cleanup of party entries when a share is removed (3b).
- DM-side visibility of shared characters (3b).

## Decisions

### Decision 1: `CampaignCharacterShare` type shape

- **Chosen:** `{ id: string; campaignId: string; characterId: string; userId: string; sharedAt: Date }`
- **Alternatives considered:** Omitting `userId` (derivable via character lookup), omitting `sharedAt` (no audit trail).
- **Rationale:** `userId` is stored denormalized for efficient `listSharesForCampaign(campaignId, userId)` queries without a join. `sharedAt` provides a lightweight audit trail and orders the list naturally. Mirrors `CampaignMember` field conventions.
- **Trade-offs:** Minor denormalization; acceptable since character ownership is immutable.

### Decision 2: Unique index on `{campaignId, characterId}` only

- **Chosen:** Unique compound index `{ campaignId: 1, characterId: 1 }`.
- **Alternatives considered:** Including `userId` in the index (would allow the same character under different users — impossible since ownership is immutable).
- **Rationale:** A character can appear in a campaign at most once. Since there is no ownership transfer, `userId` is redundant in the uniqueness constraint. Keeps the index semantically clean.
- **Trade-offs:** None. Simpler index, enforces the invariant correctly.

### Decision 3: `DuplicateShareError` in `lib/errors.ts`

- **Chosen:** Add `DuplicateShareError extends Error` to `lib/errors.ts`, following the exact `DuplicateMemberError` pattern (name, message, `captureStackTrace`).
- **Alternatives considered:** Reusing a generic error or raw 409 in the route handler.
- **Rationale:** Typed errors decouple storage from HTTP semantics; consistent with existing pattern.
- **Trade-offs:** None.

### Decision 4: Storage method signatures

- **Chosen:**
  - `addShare(share: CampaignCharacterShare): Promise<void>` — throws `DuplicateShareError` on code 11000
  - `removeShare(campaignId: string, characterId: string, userId: string): Promise<boolean>` — deletes by `{campaignId, characterId, userId}` for defense-in-depth; returns false if no record found
  - `listSharesForCampaign(campaignId: string, userId: string): Promise<CampaignCharacterShare[]>` — filtered by both campaignId and userId (caller's shares only)
- **Alternatives considered:** `listSharesForCampaign(campaignId)` without userId filter (would require route-layer filtering).
- **Rationale:** Storage-layer filtering is more efficient and prevents accidental leakage. The `userId` param is explicit and auditable.
- **Trade-offs:** The GET route always passes `auth.userId`; there is no admin/DM "list all shares" method in 3a (added in 3b if needed).

### Decision 5: Route layout follows `/members` pattern

- **Chosen:**
  - `POST   /api/campaigns/[id]/characters`        — `app/api/campaigns/[id]/characters/route.ts`
  - `GET    /api/campaigns/[id]/characters`        — same file
  - `DELETE /api/campaigns/[id]/characters/[cid]`  — `app/api/campaigns/[id]/characters/[cid]/route.ts`
- **Alternatives considered:** Routes under `/members/me/characters` (more REST-precise but adds nesting depth); character-centric routes `/api/characters/[cid]/campaigns/[id]` (unusual traversal direction for this app).
- **Rationale:** Mirrors the existing `members/` and `members/me/` file structure. Consistent with how the codebase organizes campaign-scoped resources.
- **Trade-offs:** The `[cid]` segment is a `characterId`, not a share `id`. This is intentional — the unique `{campaignId, characterId}` constraint means `characterId` is a sufficient natural key for DELETE.

### Decision 6: Player-only UI panel on campaign view

- **Chosen:** Add a "Shared Characters" collapsible panel to the campaign view, rendered only when `currentUserMember?.role === 'player' && currentUserMember?.status === 'active'`. Lists the player's own characters with a per-character share toggle.
- **Alternatives considered:** Separate page/modal; character-page integration.
- **Rationale:** Campaign context is primary for the player deciding what to share. Collapsible keeps the DM view uncluttered without conditional rendering logic in the layout.
- **Trade-offs:** Requires fetching the player's characters and their existing shares on the campaign page. Two additional API calls on page load for players.

### Decision 7: `initializeDatabase` registers the new collection

- **Chosen:** Add `campaignCharacterShares` unique index creation to `initializeDatabase()` in `lib/db.ts`, following the `campaignMembers` pattern. Also adds a non-unique `{campaignId, userId}` index for efficient `listSharesForCampaign` queries.
- **Rationale:** Consistent with how all collections are initialized in this project.
- **Trade-offs:** None.

## Proposal to Design Mapping

- Proposal: `CampaignCharacterShare` type → Decision 1 (type shape)
- Proposal: Unique `{campaignId, characterId}` index → Decision 2 (index)
- Proposal: `DuplicateShareError` → Decision 3 (error class)
- Proposal: Storage methods → Decision 4 (signatures)
- Proposal: API routes (Option A) → Decision 5 (route layout)
- Proposal: Player UI on campaign view → Decision 6 (UI panel)
- Proposal: `initializeDatabase` registration → Decision 7

## Functional Requirements Mapping

- **Requirement:** Player can share their own character into a campaign they're an active member of
  - **Design element:** POST handler verifies `getMember` returns active player + character `userId === auth.userId`
  - **Acceptance criteria reference:** specs/campaign-character-shares.md — share accepted scenario
  - **Testability notes:** Unit test with mocked storage; integration test with real MongoDB

- **Requirement:** Player cannot share a character they don't own
  - **Design element:** POST handler loads character, checks `character.userId === auth.userId`, returns 403 if not
  - **Acceptance criteria reference:** specs — unowned character rejected scenario
  - **Testability notes:** Unit test with mocked storage returning character owned by different userId

- **Requirement:** Player cannot share into a campaign where they are not an active member
  - **Design element:** POST/DELETE handler calls `getMember`, checks `status === 'active'`
  - **Acceptance criteria reference:** specs — non-member / non-active member rejected scenario
  - **Testability notes:** Unit test with getMember returning null, invited, declined, removed

- **Requirement:** Duplicate share rejected
  - **Design element:** `addShare` catches code 11000, throws `DuplicateShareError`; route returns 409
  - **Acceptance criteria reference:** specs — duplicate share scenario
  - **Testability notes:** Unit test; integration test with real MongoDB index

- **Requirement:** Player can list only their own shares for a campaign
  - **Design element:** `listSharesForCampaign(campaignId, auth.userId)` filters at storage layer
  - **Acceptance criteria reference:** specs — list shares scenario
  - **Testability notes:** Unit test confirming userId filter applied; integration test

- **Requirement:** Player can unshare a character they previously shared
  - **Design element:** DELETE handler verifies ownership then calls `removeShare(campaignId, characterId)`
  - **Acceptance criteria reference:** specs — unshare scenario
  - **Testability notes:** Unit test; verify 204 on success, 404 if not found, 403 if unowned

## Non-Functional Requirements Mapping

- **Requirement category:** Security
  - **Requirement:** A player cannot unshare another player's character
  - **Design element:** DELETE handler loads character, checks `character.userId === auth.userId` before `removeShare`
  - **Acceptance criteria reference:** specs — unshare unowned character rejected
  - **Testability notes:** Unit test with character owned by different user

- **Requirement category:** Security
  - **Requirement:** GET returns only the caller's shares, never other players'
  - **Design element:** `listSharesForCampaign` receives `auth.userId` as required parameter
  - **Acceptance criteria reference:** specs — list isolation scenario
  - **Testability notes:** Integration test with two players sharing into same campaign; verify each sees only their own

- **Requirement category:** Reliability
  - **Requirement:** No phantom shares (share record for non-existent character)
  - **Design element:** POST handler loads character from storage before calling `addShare`; returns 404 if not found
  - **Testability notes:** Unit test with storage returning null for character

- **Requirement category:** Performance
  - **Requirement:** No N+1 queries on the share list
  - **Design element:** `listSharesForCampaign` issues a single `find` with compound filter
  - **Testability notes:** Code review; integration test count

## Risks / Trade-offs

- **Risk/trade-off:** Stale share records when a character is soft-deleted
  - **Impact:** `listSharesForCampaign` may return shares for inactive characters; minor UI noise
  - **Mitigation:** Deferred to 3b. Acceptable for 3a since the party builder (3b) will add reactive filtering.

- **Risk/trade-off:** Two additional API calls on campaign page load for players
  - **Impact:** Slight increase in page load time
  - **Mitigation:** Both calls are cheap (indexed queries). Acceptable.

## Rollback / Mitigation

- **Rollback trigger:** P0 bug in share/unshare routes affecting production campaign data.
- **Rollback steps:**
  1. Revert the PR.
  2. Drop the `campaignCharacterShares` collection (data is ephemeral — no shares existed before this feature).
  3. Redeploy.
- **Data migration considerations:** None. The collection is new; rollback simply drops it.
- **Verification after rollback:** Confirm campaigns page loads without error for all member roles; confirm no 500s in logs.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing check. No `--no-verify` bypasses.
- **If security checks fail:** Do not merge. Treat as a blocker regardless of perceived severity.
- **If required reviews are blocked/stale:** Ping reviewer after 24h. Escalate to maintainer after 48h.
- **Escalation path and timeout:** After 72h without resolution, open a discussion issue linking the blocked PR.

## Open Questions

No open questions. All design decisions were resolved before artifact creation.
