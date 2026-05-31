# Phase 6 — Shared dice rolls (session-scoped)

**Goal:** Let players share dice rolls into a session, with visibility control so a
roll (e.g. a saving throw) can be sent to the DM only or to the whole group. Rolls
are tied to the active session log.

**Depends on:** Phase 5 (5b dock + feed). Reuses the existing `sessionLogs` model.

> **Tracking:** epic [#298](https://github.com/dougis-org/session-combat/issues/298).

## Deliverables (sub-issues)

### 6a. `campaignRolls` collection + roll API · [#316](https://github.com/dougis-org/session-combat/issues/316)
- Add `CampaignRoll` type; create collection with index
  `{campaignId, sessionId, createdAt}`.
- **Active-session tracking:** the current `Campaign` model has no concept of an
  *open* session (`sessionLogs` are recorded post-session). Add
  `activeSessionId?: string` to `Campaign`, set when the DM starts/opens a session
  and cleared when it ends; rolls are stamped with it. With **no** active session the
  API rejects the roll (or requires the DM to start one first) — it must not silently
  drop `sessionId`. (This `Campaign` field change may ship as a small prerequisite or
  as part of this issue.)
- `POST /api/campaigns/[id]/rolls` — record a roll (`formula`, computed `rolls[]`,
  `total`, optional `label`) against the campaign's `activeSessionId`, with a
  `visibility` (`group` | `dm-only` | `direct`+`toUserId`); `GET` filtered by
  visibility + session.
- Server-side visibility enforcement mirrors messaging; emits a stream event.
- **Depends on:** 1e, plus the `activeSessionId` addition above.
- **Acceptance:** a roll persists against the active session; rolling with no active
  session is rejected (not silently dropped); a `dm-only` roll is invisible to other
  players; rolls list scoped to the session.

### 6b. Roll-share UI in the chat dock · [#317](https://github.com/dougis-org/session-combat/issues/317)
- Roll entry control in `CampaignChat` (formula or quick buttons) with a visibility
  selector (DM-only vs Group); render rolls as a distinct feed item (formula,
  breakdown, total, roller handle, visibility marker).
- **Depends on:** 5b, 6a.
- **Acceptance:** a player rolls and shares to DM-only or group and the right
  audience sees it live in the feed; roll breakdown is legible.
