# Phase 6 — Shared dice rolls (session-scoped)

**Goal:** Let players share dice rolls into a session, with visibility control so a
roll (e.g. a saving throw) can be sent to the DM only or to the whole group. Rolls
are tied to the active session log.

**Depends on:** Phase 5 (5b dock + feed). Reuses the existing `sessionLogs` model.

## Deliverables (sub-issues)

### 6a. `campaignRolls` collection + roll API
- Add `CampaignRoll` type; create collection with index
  `{campaignId, sessionId, createdAt}`.
- `POST /api/campaigns/[id]/rolls` — record a roll (`formula`, computed `rolls[]`,
  `total`, optional `label`) against the campaign's active `sessionId`, with a
  `visibility` (`group` | `dm-only` | `direct`+`toUserId`); `GET` filtered by
  visibility + session.
- Server-side visibility enforcement mirrors messaging; emits a stream event.
- **Depends on:** 1e (and a notion of the campaign's current/active session).
- **Acceptance:** a roll persists against the right session; a `dm-only` roll is
  invisible to other players; rolls list scoped to the session.

### 6b. Roll-share UI in the chat dock
- Roll entry control in `CampaignChat` (formula or quick buttons) with a visibility
  selector (DM-only vs Group); render rolls as a distinct feed item (formula,
  breakdown, total, roller handle, visibility marker).
- **Depends on:** 5b, 6a.
- **Acceptance:** a player rolls and shares to DM-only or group and the right
  audience sees it live in the feed; roll breakdown is legible.
