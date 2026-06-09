## GitHub Issues

- #400

## Why

- Problem statement: The `campaignRolls` API (#316) needs to stamp each roll against the correct `SessionLog`. There is no mechanism to mark which session is currently live, so rolls cannot be auto-associated with the right session.
- Why now: Issue #400 is the direct prerequisite for #316 (6a). Phase 6 progress is blocked until this field and its open/close API exist.
- Business/user impact: Without `activeSessionId`, the DM has no way to signal "a session is in progress now," and the rolls API cannot function correctly.

## Problem Space

- Current behavior: `Campaign` has no `activeSessionId` field. There is no API to open or close a session. Session logs can be created manually via `POST /api/campaigns/:id/sessions` but there is no concept of a "live" session.
- Desired behavior: The DM can open a session (POST), which creates a `SessionLog` and stamps `campaign.activeSessionId`. The DM can close it (DELETE), which clears the field. `GET /api/campaigns/:id` reflects the current `activeSessionId` (null when none is active). A reset path exists to force-clear a stuck `activeSessionId` without triggering the 409 guard.
- Constraints:
  - The `setActiveCampaignSession` storage method must be a targeted atomic `updateOne` — not a full `saveCampaign` upsert — to avoid clobbering concurrent writes.
  - `activeSessionId` is set to `null` (not `$unset`) so `GET` responses include the field explicitly, and `normalizeCampaign` round-trips stay consistent.
  - No UI is in scope for this issue.
- Assumptions:
  - `normalizeCampaign` spread-then-overwrite passes `activeSessionId` through untouched; no normalization change is needed.
  - `getNextSessionNumber` is already implemented and can be called directly.
  - Next.js static segment `active` takes precedence over dynamic `[sessionId]` — no routing conflict.
- Edge cases considered:
  - DM calls POST when a session is already open → 409 Conflict.
  - DM calls DELETE when no session is open → 404.
  - Non-DM member calls either endpoint → 404 (matches existing DM-gate pattern).
  - Unauthenticated request → 401 (handled by `withAuthAndParams`).
  - Stale open session (DM crashed mid-session): DM needs a force-reset path to clear without hitting 409.

## Scope

### In Scope

- Add `activeSessionId?: string` to `Campaign` interface (`lib/types.ts`).
- Add `setActiveCampaignSession(campaignId, userId, sessionId | null)` and `claimActiveCampaignSession(campaignId, userId, sessionId)` to `lib/storage.ts`.
- New route file `app/api/campaigns/[id]/sessions/active/route.ts` with `POST` (open) and `DELETE` (close) handlers.
- `DELETE` with `?force=true` query parameter to bypass the 409 guard and force-clear a stale `activeSessionId` (reset path).
- Verify `GET /api/campaigns/:id` automatically includes `activeSessionId` once the type and storage are updated.
- Unit and integration tests for all acceptance criteria.

### Out of Scope

- UI for open/close/reset (deferred to issue 6b, #317).
- `campaignRolls` API (#316) — depends on this issue.
- Any changes to `normalizeCampaign` beyond confirming pass-through behavior.
- Editing `datePlayed` post-session (already covered by existing `PATCH /api/campaigns/:id/sessions/:sessionId`).

## What Changes

- `lib/types.ts`: Add `activeSessionId?: string` to `Campaign` after `updatedAt`.
- `lib/storage.ts`: Add `setActiveCampaignSession` method using `$set` with atomic `updateOne`.
- `app/api/campaigns/[id]/sessions/active/route.ts`: New file with `POST` and `DELETE` handlers.
  - `POST`: DM-only, 409 if already active, creates `SessionLog`, sets `activeSessionId`, returns 201.
  - `DELETE`: DM-only, 404 if none active, clears `activeSessionId`, returns 200 `{ sessionId }`. Accepts `?force=true` to unconditionally clear `activeSessionId` (escape hatch for stale state).

## Risks

- Risk: Stale `activeSessionId` (DM process died, client never called DELETE).
  - Impact: DM cannot start a new session; stuck at 409.
  - Mitigation: `DELETE ?force=true` (or `POST ?force=true`) provides a reset escape hatch. Documented in API.

- Risk: `normalizeCampaign` inadvertently strips `activeSessionId` if the field is absent in legacy docs.
  - Impact: Field silently disappears after a round-trip.
  - Mitigation: Confirmed spread-then-overwrite passes optional fields through. Test round-trip in normalization unit tests.

- Risk: `active` segment conflicts with dynamic `[sessionId]` route.
  - Impact: Route resolution error in Next.js.
  - Mitigation: Next.js gives literal segments priority over dynamic ones. Verified no conflict.

## Open Questions

No unresolved ambiguity remains. Decisions made during exploration:
- `null` (not `$unset`) used for clearing — GET returns `activeSessionId: null` explicitly.
- 409 guard kept; reset path is `DELETE ?force=true` to handle stale sessions.
- `datePlayed` defaults to `new Date()` at open time; DM patches post-session if needed.

## Non-Goals

- Real-time session presence or WebSocket notifications.
- Automatic session expiry or timeout.
- Multi-session concurrency (only one active session per campaign at a time by design).
- UI open/close controls (6b).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
