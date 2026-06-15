## GitHub Issues

- dougis-org/session-combat#314

## Why

- Problem statement: Campaign members have no persistent, visibility-scoped way to communicate within a campaign. There is no `campaignMessages` collection, no send/receive API, and no stream event type for messages.
- Why now: Phase 5b (chat dock UI, issue #315) depends on this API and collection. Phase 4 stream transport (issues #311, #312) is now complete, so the backend can be built and tested independently before the dock is wired up.
- Business/user impact: Players and DMs need in-character and out-of-character messaging with controlled visibility — group announcements, direct whispers, and DM-only private notes — all persisted and paginated for latecomers.

## Problem Space

- Current behavior: No messaging exists. `CampaignStreamEvent` has only `heartbeat` and `change` types. The transport registry (`Map<campaignId, Set<EventHandler>>`) carries no subscriber identity, so per-subscriber filtering is impossible today.
- Desired behavior: Messages persist in `campaignMessages`. `POST /api/campaigns/[id]/messages` accepts `text` + `visibility` and enforces scope server-side before emitting a stream event only to eligible subscribers. `GET` returns paginated history filtered to what the caller may see.
- Constraints:
  - Server-side SSE filtering is required — invisible messages must never reach the client wire.
  - The transport's subscriber registry must carry `userId` to enable per-subscriber dispatch.
  - Visibility enforcement must be identical in both the SSE emit path and the GET history path.
  - Phase 4 transport (issues #311/#312) is the infrastructure dependency; it is complete.
  - Issue #1e (campaign members system) is the data dependency; it is complete.
- Assumptions:
  - Any member (DM or player) may send any visibility scope — scope is not role-restricted at the send level.
  - `dm-only` means visible only to the DM(s) of the campaign plus the sender. If the sender is the DM, they are the only recipient.
  - Active members are those with `status: "active"` in `campaignMembers`. Invited/declined/removed members cannot send or receive.
  - Pagination uses a `before` cursor (ISO timestamp) against the `{campaignId, createdAt}` index, returning results newest-first by default.
- Edge cases considered:
  - Sender sends a `direct` message; recipient has since been removed — GET should still return the message to the original sender but not to the removed user.
  - DM role: a campaign may have multiple DMs (`role: "dm"`); `dm-only` messages reach all active DMs.
  - Concurrent writes: `emitFiltered` uses the in-process registry snapshot at emit time; late-joining subscribers see history via GET.

## Scope

### In Scope

- `CampaignMessage` TypeScript type in `lib/types.ts`
- `message` event variant added to `CampaignStreamEvent`
- `campaignMessages` MongoDB collection index `{campaignId: 1, createdAt: 1}` registered in `lib/db.ts`
- Transport upgrade: `userId` added to registry; `subscribe()` gains a `userId` parameter; `emitFiltered()` exported
- `app/api/campaigns/[id]/stream/route.ts` passes `auth.userId` to `subscribe()`
- `POST /api/campaigns/[id]/messages` — persist + filtered emit
- `GET /api/campaigns/[id]/messages` — paginated, visibility-filtered history

### Out of Scope

- Chat dock UI (issue #315)
- Message deletion or editing
- Read receipts or unread counts
- Push notifications
- Attachments or rich content
- Role-gating on which visibility scopes a sender may use

## What Changes

- `lib/types.ts` — add `CampaignMessage` interface; extend `CampaignStreamEvent` with `message` variant
- `lib/db.ts` — register `campaignMessages.{campaignId, createdAt}` index in `initializeDatabase()`
- `lib/server/transport.ts` — upgrade registry to `Map<string, Map<string, EventHandler>>`; update `subscribe()`; add `emitFiltered()`
- `app/api/campaigns/[id]/stream/route.ts` — pass `auth.userId` to `subscribe()`
- `app/api/campaigns/[id]/messages/route.ts` (new) — POST + GET handlers

## Risks

- Risk: Transport registry change touches shared singleton used by all active SSE connections.
  - Impact: A regression here silently breaks all campaign streams, not just messages.
  - Mitigation: Integration tests covering both change-stream and polling paths; existing stream tests must stay green.

- Risk: Visibility predicate divergence between GET history and SSE emit.
  - Impact: A player could retrieve a direct/dm-only message via GET that was never pushed to them via SSE (or vice versa).
  - Mitigation: Extract a single `canSeeMessage(message, userId, memberRole)` pure function used by both code paths.

- Risk: `dm-only` semantics — "all active DMs" vs "exactly the DM who received it".
  - Impact: If a campaign has co-DMs, dm-only messages from a player would be visible to all DMs. This is the intended behavior per assumptions, but could surprise users.
  - Mitigation: Document clearly in API response shape; revisit in Phase 5b UI copy.

## Open Questions

- Question: Should `dm-only` messages sent by a player be visible to *all* active DMs or only the campaign owner?
  - Needed from: Product / Doug
  - Blocker for apply: No — proceeding with "all active DMs" per current assumption. Confirm before 5b.

## Non-Goals

- Client-side message filtering (never acceptable for direct/dm-only messages)
- Retroactive re-filtering of historical messages if a member's role changes
- Any UI work (belongs to issue #315)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
