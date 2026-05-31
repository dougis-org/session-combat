## GitHub Issues

- #206

## Why

- **Problem statement:** The session journal (`SessionLog.events[]`) has a reserved `combat_completed` event type, but no mechanism to populate it. Combat history is structurally impossible: `CombatState` is a singleton (upserted per user) with no campaign association, so completed combats are silently overwritten and can never be referenced by session logs.
- **Why now:** #215 (combat page decomposition) is closed. All structural prerequisites are complete. #188 (session journal) is also shipped. This is the natural next step to connect the two features.
- **Business/user impact:** DMs currently have to manually remember and re-type every combat they ran when writing a session log. Auto-capture means the session log form pre-populates with completed combats — saving time and ensuring accuracy.

## Problem Space

- **Current behavior:**
  - `POST /api/combat` upserts on `{ userId }` — each new combat overwrites the previous one
  - `GET /api/combat` uses `findOne({ userId })` — can return a historical record after the change to insert
  - `CombatState` has no `campaignId` or `completedAt` fields
  - `endCombat()` in `useCombat` never calls the server — it only clears local state and HP history
  - `useCombat` sends every state change via `POST /api/combat` (upsert); it never calls `PUT /api/combat/[id]`
  - No `GET /api/campaigns/[id]/combat-events` endpoint exists
- **Desired behavior:**
  - Each combat is its own DB document (insert, not upsert)
  - Combats are associated with a campaign via `campaignId` (required on create)
  - Completed combats are preserved with a `completedAt` timestamp
  - `GET /api/combat` returns only the currently active combat
  - When a DM opens "New Session Log" for a campaign, combats completed since the last session are pre-populated as `combat_completed` events
- **Constraints:**
  - Beta environment — no backwards-compatibility shims needed; existing DB documents without `campaignId` are simply excluded from auto-capture queries
  - Deleting a combat (active or completed) is a hard delete — no soft-delete or summary capture for now
  - `campaignId` must come from the URL param (campaign-scoped route `/campaigns/[id]/combat`) — no manual selection
- **Assumptions:**
  - `useCombat` will accept `campaignId` as a parameter; the new route passes it from `params`
  - `encounterDescription` (already on `CombatState`) is sufficient for naming combat events — no new `name` field needed
  - "Since last session" window uses the campaign's most recent `SessionLog.datePlayed`; if none exists, falls back to campaign `createdAt`
- **Edge cases considered:**
  - Multiple active combats for the same user (not possible after insert — one active per user per campaign enforced by the `isActive` filter on GET)
  - Combat started but never ended (no `completedAt`) — excluded from event queries
  - No encounter selected when combat starts — `encounterDescription` will be empty; event description degrades gracefully
  - DM ends combat without having started one (defensive guard in `endCombat`)

## Scope

### In Scope

- Add `campaignId: string` and `completedAt?: Date` to `CombatState` type
- Change `POST /api/combat` from upsert to insert; require `campaignId` in body
- Change `PUT /api/combat/[id]` to set `completedAt` when `isActive` transitions to `false`
- Change `GET /api/combat` to query `{ userId, isActive: true }`
- Update `endCombat()` in `useCombat` to call `PUT /api/combat/[id]` with `{ isActive: false }` before clearing local state
- Refactor `useCombat` state updates to use `PUT /api/combat/[id]` instead of `POST /api/combat` for all changes after creation
- Accept `campaignId` param in `useCombat` and pass it on create
- Add `/campaigns/[id]/combat` route (thin page using `useCombat({ campaignId })`)
- Add `GET /api/campaigns/[id]/combat-events?since=` endpoint
- Update session log create form to fetch and pre-populate combat events
- MongoDB index: `{ userId: 1, campaignId: 1, completedAt: 1 }`
- Unit and integration tests for all above

### Out of Scope

- Capturing a combat summary on delete (may be revisited later)
- Moving or removing the standalone `/combat` route (kept as-is for now; "Start Combat" entry point moves to campaign page)
- Multi-user / real-time combat sharing
- UI for browsing combat history

## What Changes

- `lib/types.ts` — `CombatState` gains `campaignId` and `completedAt`
- `app/api/combat/route.ts` — POST becomes insert; GET filters by `isActive: true`
- `app/api/combat/[id]/route.ts` — PUT sets `completedAt` on deactivation; DELETE remains hard delete
- `lib/hooks/useCombat.ts` — accepts `campaignId`; uses PUT for updates, POST only for creation; `endCombat` calls PUT before clearing
- `app/campaigns/[id]/combat/page.tsx` — new thin page (campaign-scoped combat entry point)
- `app/api/campaigns/[id]/combat-events/route.ts` — new endpoint returning `SessionEvent[]`
- `app/campaigns/[id]/sessions/page.tsx` (or session create form) — fetches combat events and merges into pre-population list
- MongoDB: add compound index on `combatStates`

## Risks

- **Risk:** All existing `combatStates` documents have no `campaignId` — they become orphaned (not associated to any campaign).
  - **Impact:** Existing data is not queryable by campaign; auto-capture won't surface old combats.
  - **Mitigation:** Beta environment; acceptable. Existing documents excluded from auto-capture by query design (`campaignId` required in filter).
- **Risk:** `useCombat` currently sends every state change as a POST (upsert). Switching to PUT-for-updates means the first save after create must use the returned ID.
  - **Impact:** If the POST response `id` isn't stored and used for subsequent PUTs, updates will fail (404).
  - **Mitigation:** `useCombat` stores the `id` from the POST response and uses it for all subsequent PUTs within that session.
- **Risk:** `endCombat` currently never calls the server. If the PUT to set `isActive: false` fails, the combat remains active in the DB but local state is cleared — desync.
  - **Impact:** DM sees setup phase; DB has a "stuck" active combat that blocks future creates.
  - **Mitigation:** `endCombat` awaits the PUT and only clears local state on success; shows error on failure.

## Open Questions

No unresolved ambiguity remains. All decisions were made during the explore session:

| Question | Decision |
|---|---|
| Delete active combat — preserve summary? | Hard delete for now |
| `since=` fallback when no prior session | Campaign `createdAt` |
| `campaignId` source | URL param from `/campaigns/[id]/combat` |
| Standalone `/combat` route | Kept as-is; new entry point added at campaign route |
| `encounterDescription` vs new `name` field | Use existing `encounterDescription` |
| Backwards compatibility for existing DB docs | None needed (Beta) |

## Non-Goals

- Soft-delete or archival of combat documents
- Combat history browsing UI
- Multi-campaign combat (one combat is always scoped to one campaign)
- Retroactive migration of existing `combatStates` documents

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
