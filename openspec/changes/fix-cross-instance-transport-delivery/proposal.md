## GitHub Issues

- #443

## Why

- Problem statement: `message`, `roll`, and `session` `CampaignStreamEvent`s are delivered by calling `emitFiltered()` directly from the API route handler that processed the write. `emitFiltered()` only walks the in-memory `registry` Map of the process that ran the handler (`lib/server/transport.ts:12`, comment: "Module-level singletons — process-scoped state (safe on Fly.io single-process)"). When more than one Fly machine is running, a subscriber whose SSE connection is held by a different instance than the one that handled the write never receives the event — silently, with no error or log. This most visibly breaks the roll-entry strip: it stays hard-disabled ("No active session") until an `activeSessionId`-carrying `session` event arrives, which may never happen cross-instance.
- Why now: Filed as #443, "fixed" once already in PR #454 (merged 2026-06-28), and reopened 2026-07-07. The prior fix added the `session` event type and wiring end-to-end but only closed the same-instance case — it did not address that `emitFiltered` is process-local. Fly.io is configured with `min_machines_running = 0` and `auto_start_machines = true` (`fly.toml`), so multi-machine operation is an expected, not hypothetical, condition; the bug will keep recurring as usage scales.
- Business/user impact: Dice rolling — a core session-play feature — silently stops working for some fraction of players whenever the app is running on more than one machine, with no error surfaced to the DM or the affected player. The user experience is confusing (messages work, rolls don't, no visible cause) and erodes trust that a previously "closed" bug is actually fixed.

## Problem Space

- Current behavior:
  - `change` events are cross-instance-safe today: each server instance opens its own MongoDB change-stream `watch()` on the `campaigns` collection (`openStream`/`demux` in `lib/server/transport.ts`). A DB write is observed independently by every instance, so every instance's local registry receives the event regardless of which instance made the write.
  - `message`, `roll`, and `session` events are NOT cross-instance-safe: they are emitted via a direct, synchronous `emitFiltered(campaignId, event, canReceive)` call from within the route handler (`app/api/campaigns/[id]/messages/route.ts`, `app/api/campaigns/[id]/rolls/route.ts`, `app/api/campaigns/[id]/sessions/active/route.ts`). This function only iterates `registry.get(campaignId)` on the instance where the call executes.
  - `CampaignChat` (`lib/components/CampaignChat.tsx`) only treats `session` events specially to update `activeSessionId`; `change` events are otherwise ignored for that purpose. It also gives the *acting* user an optimistic local update on their own successful POST (`onRollPosted`, message append), which masks the cross-instance gap for the actor while leaving every other connected user un-notified.
- Desired behavior: Every subscriber to a campaign's stream receives `message`, `roll`, and `session` events regardless of which server instance handled the originating write, with the same reliability `change` events already have. Local/single-instance and CI/test behavior must be unaffected. No duplicate items should appear in the feed if an event is observed by more than one delivery path.
- Constraints:
  - No new infrastructure dependency (e.g. Redis pub/sub) unless justified — Fly deployment and cost profile currently assumes only MongoDB as shared state.
  - Must work correctly in both `detectReplicaSet()` outcomes: Atlas/replica-set (change streams) and local/standalone Mongo (since-timestamp polling fallback).
  - Must preserve existing latency characteristics as closely as possible for the common single-instance/local-dev case — do not introduce a fixed poll-only delay where a low-latency path exists today.
  - Existing dedup mechanisms (`seenIds` ref in `CampaignChat.tsx` for messages/rolls; layout's `activeSessionId` being idempotently set) must be sufficient to absorb any double-delivery introduced by running two delivery paths.
- Assumptions:
  - Fly.io can run more than one machine for this app at least transiently (deploys, autoscale-under-load), even if `min_machines_running = 0` normally keeps it at zero-or-one; this is confirmed as the working theory for reopened #443 in prod, not yet confirmed by direct observation of Fly's machine count.
  - The `campaigns` collection is not the only collection that needs cross-instance-safe change observation — messages and rolls live in their own collections and are not currently watched at all by the shared change stream.
  - `SessionLog`/session lifecycle writes (`storage.claimActiveCampaignSession` / `storage.setActiveCampaignSession`) already `$set` `activeSessionId` on the `campaigns` document, meaning the existing `campaigns` change-stream watch already observes session start/end cross-instance today — it's just not translated into a `session`-shaped (or otherwise consumable) event for the client.
- Edge cases considered:
  - Duplicate delivery when both a direct `emitFiltered` (same-instance fast path) and a Mongo-observed path fire for the same underlying write.
  - Standalone/local-dev Mongo (no change streams) must still get session/roll/message updates via the existing polling fallback, extended the same way as the replica-set path.
  - A message/roll/session write occurring on an instance with zero current subscribers for that campaign (no one to notify) must not error.
  - Multiple browser tabs/subscriptions for the same user (existing per-subscription-token registry design) must each independently receive events exactly once.

## Scope

### In Scope

- Making `session` event delivery (activeSessionId changes) cross-instance-safe.
- Making `roll` event delivery cross-instance-safe.
- Making `message` event delivery cross-instance-safe.
- Extending or adding change-stream/poll coverage in `lib/server/transport.ts` for the collections backing messages and rolls, and/or the `activeSessionId` field on the `campaigns` collection, to serve as the cross-instance-correct source of truth.
- Preserving (or explicitly deciding to drop) the current direct-`emitFiltered` calls as a same-instance low-latency fast path, with dedup guaranteed at the client.
- Unit test coverage that exercises delivery across two independent registry/process simulations (currently zero coverage of this failure mode), for both the replica-set and polling transport branches.
- Updating `docs/multi-user-campaigns/04-realtime-transport.md` to reflect the corrected architecture.

### Out of Scope

- Introducing a new shared-state dependency (Redis, etc.) for pub/sub — first attempt should exhaust the MongoDB-only approach already used for `change` events.
- Changing the `activeSessionId`-gates-rolls business rule itself (confirmed correct and intentional during exploration — rolls are session-scoped by design; messages are not).
- Any UI/UX changes to `RollEntryStrip` or `CampaignChat` beyond what's needed to consume the corrected event source (e.g. no redesign of the disabled-state messaging).
- Fixing or altering `assertCampaignAccess`/visibility filtering logic (`canReceive`/`canSeeRoll`) — this change is about delivery reliability, not authorization.
- Deploy/infra changes to pin Fly to a single machine — the fix should make the app correct under its existing/expected multi-machine configuration, not work around it by constraining scaling.

## What Changes

- `lib/server/transport.ts`: broaden cross-instance-safe delivery beyond the `campaigns` collection to also cover message and roll writes (mechanism to be finalized in `design.md` — options include widening the existing change-stream watch to additional collections, or a db-level watch, mirrored in the polling fallback), and ensure `activeSessionId` changes observed via the `campaigns` watch/poll are translated into an event the client can act on.
- `app/api/campaigns/[id]/messages/route.ts`, `app/api/campaigns/[id]/rolls/route.ts`, `app/api/campaigns/[id]/sessions/active/route.ts`: decide whether direct `emitFiltered` calls remain (as a same-instance fast path) alongside the new cross-instance-safe path, or are removed in favor of it exclusively.
- `lib/components/CampaignChat.tsx`: ensure the client correctly dedups when the same logical event can arrive via two paths (same-instance fast path + Mongo-observed path), and correctly derives `activeSessionId` updates from whichever path is authoritative.
- `tests/unit/server/transport.test.ts`: add coverage simulating two independent process/registry instances to prove cross-instance delivery.
- `docs/multi-user-campaigns/04-realtime-transport.md`: update the architecture diagram/description to match.

## Risks

- Risk: Broadening the change-stream watch (e.g. to a db-level watch or multiple collections) increases the volume of change events each instance must filter/demux, which could add CPU/memory overhead per instance.
  - Impact: Possible latency or resource regression under load, especially with many concurrent campaigns/messages.
  - Mitigation: Keep the "one shared cursor per instance, demuxed in-process" pattern already used for `campaigns`; measure/test with realistic event volume; filter server-side (query/pipeline) where possible rather than relying purely on in-process filtering.
- Risk: Running both a same-instance fast path and a Mongo-observed path introduces duplicate-delivery bugs if dedup isn't airtight.
  - Impact: Duplicate messages/rolls in the feed, or a session event applied twice (idempotent, so lower risk) causing visual glitches or confusing double-notifications.
  - Mitigation: Rely on and extend existing `seenIds`-style dedup by stable id; add explicit unit tests for double-delivery scenarios.
- Risk: The polling fallback (non-replica-set/local dev) needs the same fix applied in parallel to the change-stream path, doubling the surface area to get right.
  - Impact: Fix could work in prod (Atlas) but leave local dev/CI still broken for cross-instance-shaped tests, or vice versa.
  - Mitigation: Design and test both branches explicitly; do not consider the change done until both are covered.
- Risk: We have not directly confirmed (via `fly status` or Fly dashboard) that prod is currently running more than one machine.
  - Impact: If prod is in fact always a single machine, the actual root cause of the reopened #443 report might be something else, and this change would not fix it.
  - Mitigation: Treat as the leading, well-evidenced hypothesis (matches the intermittent/session-dependent bug shape, the `fly.toml` autoscale config, and the explicit "single-process" comment in the code); flagged as an open question below — worth a direct confirmation before/alongside implementation, but the architecture gap is real and worth closing regardless since it's a latent correctness issue independent of whether it's actively firing in prod today.

## Open Questions

- Question: Can we directly confirm prod is/has been running multiple Fly machines concurrently (e.g. via `fly status`, `fly machine list`, or Fly metrics/logs) to validate the root-cause hypothesis before implementing?
  - Needed from: repo owner (Fly account access)
  - Blocker for apply: no — the architecture gap is a real latent bug regardless of current confirmed machine count, and closing it is worthwhile prophylactically per the user's stated goal ("so when we do scale up it works properly").
- Question: Should the direct `emitFiltered` same-instance fast path be kept (dual delivery + dedup) or removed entirely in favor of routing everything through the Mongo-observed path?
  - Needed from: design decision — will be resolved in `design.md`, leaning toward keep-as-fast-path-with-dedup to preserve today's low latency in the common case, but worth stating explicitly for review.
  - Blocker for apply: no — resolvable in design.
- Question: Is a single shared db-level `watch()` (covering campaigns, messages, and rolls collections in one cursor) preferable to three separate per-collection watches, given the "keep the count of streams to Mongo as low as possible" principle already documented in `docs/multi-user-campaigns/04-realtime-transport.md`?
  - Needed from: design decision — will be resolved in `design.md`.
  - Blocker for apply: no.

## Non-Goals

- Redesigning the transport abstraction beyond what's needed to fix cross-instance delivery (e.g. no move to a different real-time technology, no WebSocket migration).
- Adding delivery guarantees beyond "eventually consistent, deduped, at-least-once within the lifetime of an open connection" — no durable event log, no replay-from-arbitrary-point guarantee beyond what history endpoints already provide.
- Load-testing or capacity-planning the transport layer beyond confirming the fix doesn't regress the existing single-instance case.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
