## Context

- **Relevant architecture:** Next.js App Router API routes; MongoDB via `lib/storage.ts`; `withAuth`/`withAuthAndParams` middleware from `lib/middleware.ts`; `CampaignMember` documents with `history: MemberHistoryEntry[]`; existing `storage.getMember` and `storage.updateMemberStatus`.
- **Dependencies:** Phase 1d (members storage) and Phase 2a (invite API, #305) — both merged. `CampaignMember.status` values `"invited"`, `"active"`, `"declined"`, `"removed"` are live.
- **Interfaces/contracts touched:** `lib/types.ts` (`User`, new `PublicUser`); `lib/storage.ts` (3 new methods); 2 new API route files; no changes to existing routes.

## Goals / Non-Goals

### Goals

- Allow an invited player to accept or decline a campaign invitation via `PATCH /api/campaigns/[id]/members/me`
- Allow a player to list their pending invitations via `GET /api/me/invitations`, with campaign name and inviter username
- Make `User.username` required in the type system (data already backfilled)
- Add typed, storage-layer user lookup methods (`getUserById`, `getUsersByIds`)

### Non-Goals

- UI for accepting/declining (issue #308)
- Pagination on invitations list
- Real-time / push notifications
- DM-side invitation management UI (issue #307)

## Decisions

### Decision 1: PATCH `/api/campaigns/[id]/members/me` for respond action

- **Chosen:** `PATCH /api/campaigns/[id]/members/me` with body `{ "action": "accept" | "decline" }`
- **Alternatives considered:** `POST /api/campaigns/[id]/members/respond` (action-oriented RPC)
- **Rationale:** REST standard — the player is mutating their own membership resource. `/me` scopes the resource to the caller without requiring a memberId in the URL. `action` vocabulary (`accept`/`decline`) is used in the body rather than internal status values to avoid leaking domain internals to the client.
- **Trade-offs:** Slightly less discoverable than a named action endpoint, but more consistent with REST conventions used elsewhere.

### Decision 2: Idempotency rule for PATCH

- **Chosen:** Same action as current status → 200 (no DB write, no history entry). Conflicting action → 409 with message.
- **Alternatives considered:** Always write, treating repeat as a new history entry; or 400 for any repeat.
- **Rationale:** True idempotency for network retries (accept after transient failure returns 200, not 409). Conflicting requests indicate client confusion, not network retry — 409 is appropriate.
- **Trade-offs:** Idempotent path skips history — acceptable since no state change occurred.

### Decision 3: `getUsersByIds` batch lookup in storage

- **Chosen:** `storage.getUsersByIds(userIds: string[]): Promise<Record<string, string>>` returning `{ [userId]: username }`.
- **Alternatives considered:** N individual `getUserById` calls inside the route; a MongoDB `$lookup` aggregation in `listInvitationsForUser`.
- **Rationale:** Batch query is O(1) round trips vs O(n). Keeping the join in the route (not storage) preserves storage-layer simplicity — storage returns domain objects, routes compose responses.
- **Trade-offs:** Route is slightly more complex. Missing users (deleted accounts) silently return an empty entry; route falls back to `"Unknown user"` — acceptable edge case.

### Decision 4: `getUserById` lives in `storage.ts`, not `permissions.ts`

- **Chosen:** New typed `storage.getUserById(userId): Promise<PublicUser | null>` — projects only `id` and `username`. Existing `permissions.ts` `getUserById` (returns `Record<string, unknown>`) is left unchanged for auth use.
- **Alternatives considered:** Enhance `permissions.ts` version; share one function.
- **Rationale:** The permissions version is scoped to auth/admin checks and projects `email`, `tokenVersion`, `isAdmin`. Mixing concerns would require a broader projection or conditional logic. A clean typed method in storage is simpler and more maintainable.
- **Trade-offs:** Two functions named similarly in different modules — mitigated by different import paths and return types.

### Decision 5: `invitedAt` / `invitedBy` derived from last `action: "invited"` history entry

- **Chosen:** Scan `history` array in reverse and return the first entry with `action: "invited"`.
- **Alternatives considered:** Always use `history[0]`; store a denormalized field.
- **Rationale:** A re-invite cycle appends a new `"invited"` entry — the last one is the most recent invitation, which is what the player sees.
- **Trade-offs:** Requires a linear scan of history (small array in practice).

### Decision 6: `User.username` made required

- **Chosen:** Remove `?` from `User.username` in `lib/types.ts`. Add `PublicUser { id: string; username: string }` for route response shaping.
- **Alternatives considered:** Keep optional, add runtime fallback everywhere.
- **Rationale:** Backfill already run on all 4 users. Making it required eliminates defensive coding everywhere username is accessed. `PublicUser` provides a minimal public-safe interface that doesn't expose `passwordHash`, `tokenVersion`, etc.
- **Trade-offs:** Any code constructing a `User` object without `username` will fail TypeScript compilation — these sites must be updated as part of this task.

## Proposal to Design Mapping

- Proposal element: `PATCH /api/campaigns/[id]/members/me`
  - Design decision: Decision 1
  - Validation approach: Unit tests for all state-machine paths; auth guard tests

- Proposal element: Idempotency + 409 conflict rule
  - Design decision: Decision 2
  - Validation approach: Unit tests for same-action (idempotent) and conflicting-action (409) cases

- Proposal element: `GET /api/me/invitations` with username in response
  - Design decision: Decision 3
  - Validation approach: Unit test mocking `listInvitationsForUser`, `getUsersByIds`, campaign lookup

- Proposal element: `getUserById` and `getUsersByIds` in storage
  - Design decision: Decisions 3 + 4
  - Validation approach: Storage unit tests with real MongoDB test DB

- Proposal element: `invitedBy` / `invitedAt` from history
  - Design decision: Decision 5
  - Validation approach: Unit test with re-invited member (multiple `"invited"` history entries)

- Proposal element: `User.username` required + `PublicUser`
  - Design decision: Decision 6
  - Validation approach: TypeScript compilation; grep construction sites before merge

## Functional Requirements Mapping

- Requirement: Invited user can accept → status becomes `active`
  - Design element: PATCH route; `updateMemberStatus(campaignId, userId, "active", callerId)`
  - Acceptance criteria reference: specs/accept-decline-api/spec.md — PATCH accept scenario
  - Testability notes: Mock `getMember` returning `invited`; assert `updateMemberStatus` called with `"active"`

- Requirement: Invited user can decline → status becomes `declined`
  - Design element: PATCH route; `updateMemberStatus(campaignId, userId, "declined", callerId)`
  - Acceptance criteria reference: specs — PATCH decline scenario
  - Testability notes: Mock `getMember` returning `invited`; assert `updateMemberStatus` called with `"declined"`

- Requirement: Idempotent repeat of same action → 200, no DB write
  - Design element: PATCH route status-machine logic; early return before `updateMemberStatus`
  - Acceptance criteria reference: specs — idempotent scenarios
  - Testability notes: Assert `updateMemberStatus` NOT called; response status 200

- Requirement: Conflicting action → 409
  - Design element: PATCH route conflict detection branch
  - Acceptance criteria reference: specs — conflict scenarios
  - Testability notes: Assert 409 with correct error message text

- Requirement: Non-member / removed → 404
  - Design element: PATCH route; null-membership and `removed` status checks
  - Acceptance criteria reference: specs — not-found scenarios
  - Testability notes: Mock `getMember` returning null or `{ status: "removed" }`

- Requirement: Only caller can respond (not others)
  - Design element: `getMember(campaignId, auth.userId)` — lookup uses authenticated userId, not a param
  - Acceptance criteria reference: specs — authorization scenarios
  - Testability notes: No userId in URL; auth middleware provides callerId

- Requirement: GET returns pending invitations with campaign name + inviter username
  - Design element: `listInvitationsForUser` + campaign lookup + `getUsersByIds`
  - Acceptance criteria reference: specs — invitations list scenarios
  - Testability notes: Mock all three data sources; assert response shape

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Only authenticated users can call either endpoint
  - Design element: `withAuth` / `withAuthAndParams` middleware
  - Acceptance criteria reference: specs — unauthenticated → 401
  - Testability notes: Omit auth token; assert 401

- Requirement category: security
  - Requirement: User can only respond to their own invitation
  - Design element: Membership lookup uses `auth.userId` (not a URL param)
  - Acceptance criteria reference: specs — no userId in PATCH URL
  - Testability notes: Structural — no code path allows responding for another user

- Requirement category: reliability
  - Requirement: Concurrent accept/decline calls handled safely
  - Design element: `updateMemberStatus` uses atomic `updateOne`; last write wins
  - Acceptance criteria reference: proposal risk section
  - Testability notes: Not unit-testable in isolation; acceptable given low concurrency risk

- Requirement category: operability
  - Requirement: Storage errors surface as 500, not leaked internals
  - Design element: `try/catch` in both routes; `console.error` server-side only
  - Acceptance criteria reference: specs — storage error scenarios
  - Testability notes: Mock storage to throw; assert 500 with generic body

- Requirement category: performance
  - Requirement: Invitations list avoids N+1 user lookups
  - Design element: `getUsersByIds` batch query
  - Acceptance criteria reference: N/A (implementation detail)
  - Testability notes: Assert single `getUsersByIds` call regardless of invitation count

## Risks / Trade-offs

- Risk/trade-off: `username` required breaks construction sites that omit it
  - Impact: TypeScript build failure
  - Mitigation: Task includes explicit step to grep and fix all `User` construction sites

- Risk/trade-off: Deleted user's username missing from batch lookup
  - Impact: `invitedBy` shows `"Unknown user"` for that invitation
  - Mitigation: Accepted; extremely unlikely in current usage; invitation still shown

## Rollback / Mitigation

- **Rollback trigger:** Critical bug in PATCH route causing incorrect status transitions.
- **Rollback steps:** Revert the PR; no data migration required (DB writes use existing `updateMemberStatus` pattern).
- **Data migration considerations:** Making `username` required is a type-system-only change — no DB schema migration. The backfill is already applied.
- **Verification after rollback:** Confirm `GET /api/me/invitations` returns 404 (route removed) and existing invite flow still works.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing check. Do not use admin override.
- **If security checks fail:** Do not merge. Investigate and remediate before proceeding.
- **If required reviews are blocked/stale:** Ping reviewer after 24h. Escalate to team lead after 48h.
- **Escalation path and timeout:** If blocked >48h with no response, raise in team standup.

## Open Questions

No open questions. All decisions made during exploration session prior to proposal creation.
